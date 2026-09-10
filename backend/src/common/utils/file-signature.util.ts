import { BadRequestException } from '@nestjs/common';
import * as path from 'path';

export interface FileSignatureValidationOptions {
  originalFilename: string;
  mimeType: string;
  buffer: Buffer;
}

/**
 * Validates binary magic byte headers for uploaded documents.
 * Ensures the content matches the declared extension and MIME type.
 * Specifically checks for valid PDF and valid OpenXML (DOCX) package structures.
 */
export function validateDocumentSignature(file: FileSignatureValidationOptions): void {
  const ext = path.extname(file.originalFilename || '').toLowerCase();
  const mime = (file.mimeType || '').toLowerCase();
  const buffer = file.buffer;

  if (!buffer || buffer.length < 4) {
    throw new BadRequestException('File is empty or corrupted');
  }

  // 1. PDF Verification: Must begin with %PDF- (0x25 0x50 0x44 0x46 0x2D)
  if (ext === '.pdf' || mime === 'application/pdf') {
    const isPdfMagic =
      buffer[0] === 0x25 && // %
      buffer[1] === 0x50 && // P
      buffer[2] === 0x44 && // D
      buffer[3] === 0x46; // F

    if (!isPdfMagic) {
      throw new BadRequestException('File signature does not match PDF format. Uploaded file is corrupted or spoofed.');
    }
    return;
  }

  // 2. DOCX Verification: Must begin with PK\x03\x04 (0x50 0x4B 0x03 0x04) for ZIP container
  // and must contain standard OpenXML content markers to ensure it is not an arbitrary generic ZIP file.
  if (
    ext === '.docx' ||
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    ext === '.doc' ||
    mime === 'application/msword'
  ) {
    const isZipMagic =
      buffer[0] === 0x50 && // P
      buffer[1] === 0x4B && // K
      buffer[2] === 0x03 &&
      buffer[3] === 0x04;

    if (!isZipMagic) {
      throw new BadRequestException('File signature does not match Microsoft Word (.docx) format.');
    }

    // Inspect buffer to confirm it contains OpenXML content identifiers ('[Content_Types].xml' or 'word/')
    // to distinguish authentic DOCX packages from arbitrary ZIP archives.
    const bufferString = buffer.toString('utf-8', 0, Math.min(buffer.length, 2048));
    const hasDocxMarkers =
      bufferString.includes('[Content_Types].xml') ||
      bufferString.includes('word/') ||
      bufferString.includes('_rels/');

    if (!hasDocxMarkers) {
      throw new BadRequestException(
        'Uploaded archive is not a valid Microsoft Word document package.',
      );
    }
    return;
  }

  throw new BadRequestException(`Unsupported file format for signature verification: ${ext}`);
}

/**
 * Sanitizes a client-provided original filename.
 * Strips directory traversal sequences, null bytes, control characters, and dangerous characters.
 */
export function sanitizeFilename(originalFilename: string, fallbackName: string = 'document.pdf'): string {
  if (!originalFilename || typeof originalFilename !== 'string') {
    return fallbackName;
  }

  // 1. Strip path components (path traversal defense)
  let cleanName = path.basename(originalFilename);

  // 2. Remove null bytes, control characters, CRLF
  cleanName = cleanName.replace(/[\0\r\n\x00-\x1f\x7f-\x9f]/g, '');

  // 3. Remove dangerous shell/path characters
  cleanName = cleanName.replace(/[/\\?%*:|"<>]/g, '_');

  // 4. Trim whitespace and dots
  cleanName = cleanName.trim().replace(/^\.+/, '');

  if (!cleanName || cleanName.length === 0) {
    return fallbackName;
  }

  // 5. Enforce safe length limit (max 120 chars)
  if (cleanName.length > 120) {
    const ext = path.extname(cleanName);
    const base = path.basename(cleanName, ext);
    cleanName = `${base.substring(0, 120 - ext.length)}${ext}`;
  }

  return cleanName;
}
