import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RateLimit } from '../../../common/decorators/rate-limit.decorator';
import { PlacementDocumentsService } from '../services/placement-documents.service';
import { PlacementDocumentType, UserRole } from '@prisma/client';

@Controller('placements')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PlacementDocumentsController {
  constructor(private readonly documentsService: PlacementDocumentsService) {}

  @Post('offers/:offerId/documents')
  @Roles(UserRole.INDUSTRY, UserRole.SUPER_ADMIN)
  @RateLimit({ points: 10, durationSeconds: 300, errorMessage: 'Document upload rate limit exceeded. Please wait before uploading again.' })
  async uploadOfferDocument(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Param('offerId') offerId: string,
    @Body()
    body: {
      originalFilename: string;
      mimeType: string;
      fileBase64: string;
      documentType?: PlacementDocumentType;
    },
  ) {
    const buffer = Buffer.from(body.fileBase64, 'base64');
    return this.documentsService.storeOfferDocument(
      userId,
      userRole,
      offerId,
      {
        originalFilename: body.originalFilename,
        mimeType: body.mimeType,
        buffer,
      },
      body.documentType || PlacementDocumentType.OFFER_LETTER,
    );
  }

  @Get('documents/:id/download')
  @Roles(
    UserRole.STUDENT,
    UserRole.INDUSTRY,
    UserRole.INSTITUTION_ADMIN,
    UserRole.SUPER_ADMIN,
  )
  async downloadDocument(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const { document, filePath } = await this.documentsService.getAuthorizedDocument(
      id,
      userId,
      userRole,
    );

    // Sanitize original filename to prevent CRLF / header injection in Content-Disposition
    const safeFilename = document.originalFilename.replace(/[\r\n"\\]/g, '_');

    res.setHeader('Content-Type', document.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${safeFilename}"`,
    );
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.sendFile(filePath);
  }
}
