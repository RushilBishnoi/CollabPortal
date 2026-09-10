import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { DOCUMENT_CONFIG } from '../config/application.constants';
import { DocumentType, UserRole } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import {
  validateDocumentSignature,
  sanitizeFilename,
} from '../../../common/utils/file-signature.util';

@Injectable()
export class ApplicationDocumentsService {
  private readonly logger = new Logger(ApplicationDocumentsService.name);
  private readonly storageDir: string;

  constructor(private readonly prisma: PrismaService) {
    const storageBase = process.env.STORAGE_DIR || path.resolve(process.cwd(), 'storage');
    this.storageDir = path.join(storageBase, 'applications');
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  /**
   * Validate and persist an uploaded application document within a transaction.
   */
  async storeDocument(
    tx: any,
    applicationId: string,
    file: {
      originalFilename: string;
      mimeType: string;
      buffer: Buffer | string;
      sizeBytes?: number;
    },
    documentType: DocumentType = DocumentType.RESUME,
  ) {
    // 1. Validate File Size
    const rawBuffer = Buffer.isBuffer(file.buffer)
      ? file.buffer
      : Buffer.from(file.buffer, typeof file.buffer === 'string' ? 'base64' : 'utf-8');

    const size = file.sizeBytes || rawBuffer.length;
    if (size > DOCUMENT_CONFIG.MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException(
        `File exceeds maximum permitted size of ${DOCUMENT_CONFIG.MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB.`,
      );
    }

    // 2. Validate MIME Type and Extension (Strict Check: BOTH must be permitted)
    const mime = (file.mimeType || '').toLowerCase();
    const ext = path.extname(file.originalFilename || '').toLowerCase();

    const isAllowedMime = (DOCUMENT_CONFIG.ALLOWED_MIME_TYPES as readonly string[]).includes(mime);
    const isAllowedExt = (DOCUMENT_CONFIG.ALLOWED_EXTENSIONS as readonly string[]).includes(ext);

    if (!isAllowedMime || !isAllowedExt) {
      throw new BadRequestException(
        `Invalid file type (${mime || ext}). Only PDF and Word documents are permitted.`,
      );
    }

    // 3. Binary Magic Byte Signature Inspection
    validateDocumentSignature({
      originalFilename: file.originalFilename,
      mimeType: mime,
      buffer: rawBuffer,
    });

    // 4. Generate Safe Cryptographic Storage Key and Sanitize Original Filename
    const safeExt = ext || (mime.includes('pdf') ? '.pdf' : '.docx');
    const storageKey = `${crypto.randomUUID()}${safeExt}`;
    const filePath = path.join(this.storageDir, storageKey);
    const sanitizedOriginalFilename = sanitizeFilename(file.originalFilename, 'resume.pdf');

    // 5. Write File to Secure Disk Storage
    await fs.promises.writeFile(filePath, rawBuffer);

    // 6. Create Document Record in DB
    const doc = await tx.applicationDocument.create({
      data: {
        applicationId,
        documentType,
        originalFilename: sanitizedOriginalFilename,
        mimeType: mime || 'application/pdf',
        sizeBytes: size,
        storageKey,
      },
    });

    return doc;
  }

  /**
   * Retrieve document metadata and file buffer with authorization enforcement.
   */
  async getAuthorizedDocument(
    docId: string,
    userId: string,
    userRole: UserRole,
  ) {
    const doc = await this.prisma.applicationDocument.findUnique({
      where: { id: docId },
      include: {
        application: {
          include: {
            studentProfile: true,
            opportunity: {
              include: {
                industryProfile: true,
              },
            },
          },
        },
      },
    });

    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    // Check ownership authorization
    if (userRole === UserRole.STUDENT) {
      if (doc.application.studentProfile.userId !== userId) {
        throw new ForbiddenException('You are not authorized to access this document');
      }
    } else if (userRole === UserRole.INDUSTRY) {
      if (doc.application.opportunity.industryProfile.userId !== userId) {
        throw new ForbiddenException('You are not authorized to access candidate documents for another company');
      }
    } else if (userRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Insufficient permissions to access application document');
    }

    const filePath = path.join(this.storageDir, doc.storageKey);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Document file missing on storage server');
    }

    return {
      doc,
      filePath,
      originalFilename: doc.originalFilename,
      mimeType: doc.mimeType,
      sizeBytes: doc.sizeBytes,
    };
  }
}
