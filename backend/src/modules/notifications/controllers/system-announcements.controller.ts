import {
  Controller,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { SystemAnnouncementsService } from '../services/system-announcements.service';
import { CreateSystemAnnouncementDto } from '../dto/create-announcement.dto';

@Controller('notifications/announcements')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class SystemAnnouncementsController {
  constructor(private readonly announcementsService: SystemAnnouncementsService) {}

  /**
   * Super Admin: Broadcast system announcement.
   */
  @Post()
  async broadcastAnnouncement(
    @CurrentUser('id') adminUserId: string,
    @Body() dto: CreateSystemAnnouncementDto,
  ) {
    return this.announcementsService.broadcastAnnouncement(adminUserId, dto);
  }
}
