import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { NotificationPreferencesService } from '../services/notification-preferences.service';
import { UpdateNotificationPreferencesDto } from '../dto/update-preferences.dto';

@Controller('notifications/preferences')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationPreferencesController {
  constructor(private readonly preferencesService: NotificationPreferencesService) {}

  /**
   * Get user notification preferences with mandatory indicators.
   */
  @Get()
  async getMyPreferences(@CurrentUser('id') userId: string) {
    return this.preferencesService.getPreferences(userId);
  }

  /**
   * Update notification preferences.
   * Rejects attempts to disable mandatory notification types.
   */
  @Put()
  async updateMyPreferences(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateNotificationPreferencesDto,
  ) {
    return this.preferencesService.updatePreferences(userId, dto.preferences);
  }
}
