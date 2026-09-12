import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { UserRole, MentorshipRequestStatus } from '@prisma/client';
import { MentorProfilesService } from '../services/mentor-profiles.service';
import { MentorAvailabilityService } from '../services/mentor-availability.service';
import { MentorshipRequestsService } from '../services/mentorship-requests.service';
import { UpsertMentorProfileDto } from '../dto/upsert-mentor-profile.dto';
import { SetAvailabilityDto } from '../dto/set-availability.dto';
import { RespondMentorshipRequestDto } from '../dto/respond-mentorship-request.dto';

@Controller('mentor/workspace')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.INDUSTRY, UserRole.FACULTY, UserRole.SUPER_ADMIN)
export class MentorWorkspaceController {
  constructor(
    private readonly profilesService: MentorProfilesService,
    private readonly availabilityService: MentorAvailabilityService,
    private readonly requestsService: MentorshipRequestsService,
  ) {}

  @Get('profile')
  async getMyProfile(@CurrentUser('id') userId: string) {
    const data = await this.profilesService.getMyProfile(userId);
    return { success: true, data };
  }

  @Put('profile')
  async upsertProfile(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
    @Body() dto: UpsertMentorProfileDto,
  ) {
    const data = await this.profilesService.upsertProfile(userId, role, dto);
    return { success: true, data };
  }

  @Put('availability')
  async setAvailability(
    @CurrentUser('id') userId: string,
    @Body() dto: SetAvailabilityDto,
  ) {
    const data = await this.availabilityService.setAvailability(userId, dto);
    return { success: true, data };
  }

  @Get('requests')
  async getIncomingRequests(
    @CurrentUser('id') userId: string,
    @Query('status') status?: MentorshipRequestStatus,
  ) {
    const data = await this.requestsService.getMentorRequests(userId, status);
    return { success: true, data };
  }

  @Post('requests/:id/respond')
  async respondToRequest(
    @CurrentUser('id') userId: string,
    @Param('id') requestId: string,
    @Body() dto: RespondMentorshipRequestDto,
  ) {
    const data = await this.requestsService.respondToRequest(userId, requestId, dto);
    return { success: true, data };
  }

  @Get('mentorships')
  async getMyMentorships(@CurrentUser('id') userId: string) {
    const data = await this.requestsService.getMentorMentorships(userId);
    return { success: true, data };
  }

  @Post('mentorships/:id/complete')
  async completeMentorship(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
    @Param('id') mentorshipId: string,
    @Body('notes') notes?: string,
  ) {
    const data = await this.requestsService.completeMentorship(
      userId,
      role,
      mentorshipId,
      notes,
    );
    return { success: true, data };
  }
}
