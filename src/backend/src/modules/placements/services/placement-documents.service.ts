import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { PLACEMENT_DOCUMENT_CONFIG } from '../constants/placement.constants';
import { PlacementDocumentType, UserRole } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import {
  validateDocumentSignature,
  sanitizeFilename,
} from '../../../common/utils/file-signature.util';

@Injectable()
export class PlacementDocumentsService {
  private readonly logger = new Logger(PlacementDocumentsService.name);
  private readonly storageDir: string;

  constructor(private readonly prisma: PrismaService) {
    const storageBase =
      process.env.STORAGE_DIR ||
      (process.env.VERCEL ? path.join('/tmp', 'storage') : path.resolve(process.cwd(), 'storage'));
    this.storageDir = path.join(storageBase, 'placements');
  }

  private async ensureStorageDir(): Promise<void> {
    if (!fs.existsSync(this.storageDir)) {
      await fs.promises.mkdir(this.storageDir, { recursive: true });
    }
  }

  /**
   * Upload and persist an offer document.
   */
  async storeOfferDocument(
    userId: string,
    userRole: UserRole,
    offerId: string,
    file: {
      originalFilename: string;
      mimeType: string;
      buffer: Buffer | string;
      sizeBytes?: number;
    },
    documentType: PlacementDocumentType = PlacementDocumentType.OFFER_LETTER,
  ) {
    const offer = await this.prisma.placementOffer.findUnique({
      where: { id: offerId },
      include: { placement: true },
    });

    if (!offer) {
      throw new NotFoundException('Placement offer not found.');
    }

    if (userRole === UserRole.INDUSTRY) {
      const industry = await this.prisma.industryProfile.findUnique({
        where: { userId },
      });
      if (!industry || offer.industryProfileId !== industry.id) {
        throw new ForbiddenException('You do not have permission to attach documents to this offer.');
      }
    }

    // 1. Validate File Size
    const rawBuffer = Buffer.isBuffer(file.buffer)
      ? file.buffer
      : Buffer.from(file.buffer, typeof file.buffer === 'string' ? 'base64' : 'utf-8');

    const size = file.sizeBytes || rawBuffer.length;
    if (size > PLACEMENT_DOCUMENT_CONFIG.MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException(
        `File exceeds maximum permitted size of ${
          PLACEMENT_DOCUMENT_CONFIG.MAX_FILE_SIZE_BYTES / (1024 * 1024)
        }MB.`,
      );
    }

    // 2. Validate MIME & Ext (Strict Check: BOTH must be permitted)
    const mime = (file.mimeType || '').toLowerCase();
    const ext = path.extname(file.originalFilename || '').toLowerCase();

    const isAllowedMime = (PLACEMENT_DOCUMENT_CONFIG.ALLOWED_MIME_TYPES as readonly string[]).includes(mime);
    const isAllowedExt = (PLACEMENT_DOCUMENT_CONFIG.ALLOWED_EXTENSIONS as readonly string[]).includes(ext);

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

    // 4. Generate Crypto Storage Key and Sanitize Original Filename
    const safeExt = ext || (mime.includes('pdf') ? '.pdf' : '.docx');
    const storageKey = `${crypto.randomUUID()}${safeExt}`;
    const filePath = path.join(this.storageDir, storageKey);
    const sanitizedOriginalFilename = sanitizeFilename(file.originalFilename, 'offer-letter.pdf');

    // 5. Write File
    await this.ensureStorageDir();
    await fs.promises.writeFile(filePath, rawBuffer);

    // 6. Create Document Record
    const doc = await this.prisma.placementDocument.create({
      data: {
        offerId,
        placementId: offer.placement ? (offer as any).placement.id : null,
        documentType,
        originalFilename: sanitizedOriginalFilename,
        mimeType: mime || 'application/pdf',
        sizeBytes: size,
        storageKey,
        uploadedByRole: userRole,
        uploadedByUserId: userId,
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
    const doc = await this.prisma.placementDocument.findUnique({
      where: { id: docId },
      include: {
        offer: {
          include: {
            studentProfile: true,
            industryProfile: true,
          },
        },
        placement: {
          include: {
            studentProfile: true,
            institution: true,
            industryProfile: true,
          },
        },
      },
    });

    if (!doc) {
      throw new NotFoundException('Placement document not found.');
    }

    // Authorization check
    if (userRole === UserRole.SUPER_ADMIN) {
      // Super admin can download all documents
    } else if (userRole === UserRole.STUDENT) {
      const student = await this.prisma.studentProfile.findUnique({
        where: { userId },
      });
      const docStudentId =
        doc.offer?.studentProfileId || doc.placement?.studentProfileId;
      if (!student || docStudentId !== student.id) {
        throw new ForbiddenException('Access denied to this document.');
      }
    } else if (userRole === UserRole.INDUSTRY) {
      const industry = await this.prisma.industryProfile.findUnique({
        where: { userId },
      });
      const docIndustryId =
        doc.offer?.industryProfileId || doc.placement?.industryProfileId;
      if (!industry || docIndustryId !== industry.id) {
        throw new ForbiddenException('Access denied to this document.');
      }
    } else if (userRole === UserRole.INSTITUTION_ADMIN) {
      const institution = await this.prisma.institutionProfile.findUnique({
        where: { userId },
      });
      const studentInstId =
        doc.placement?.institutionId ||
        doc.offer?.studentProfile?.institutionId;
      if (!institution || studentInstId !== institution.id) {
        throw new ForbiddenException('Access denied to this document.');
      }
    } else {
      throw new ForbiddenException('You do not have permission to access placement documents.');
    }

    const filePath = path.join(this.storageDir, doc.storageKey);
    if (!fs.existsSync(filePath)) {
      this.logger.error(`Document file missing on disk: ${filePath}`);
      throw new NotFoundException('Document file not found on storage server.');
    }

    return {
      document: doc,
      filePath,
    };
  }
}
