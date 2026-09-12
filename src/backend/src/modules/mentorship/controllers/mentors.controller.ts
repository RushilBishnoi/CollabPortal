import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { MentorProfilesService } from '../services/mentor-profiles.service';
import { MentorAvailabilityService } from '../services/mentor-availability.service';
import { QueryMentorsDto } from '../dto/query-mentors.dto';

@Controller('mentors')
@UseGuards(JwtAuthGuard)
export class MentorsController {
  constructor(
    private readonly profilesService: MentorProfilesService,
    private readonly availabilityService: MentorAvailabilityService,
  ) {}

  @Get()
  async findMentors(@Query() query: QueryMentorsDto) {
    const result = await this.profilesService.findMentors(query);
    return {
      success: true,
      data: result.items,
      meta: result.meta,
    };
  }

  @Get(':id')
  async getMentorById(@Param('id') id: string) {
    const data = await this.profilesService.getMentorById(id);
    return { success: true, data };
  }

  @Get(':id/availability')
  async getMentorAvailability(@Param('id') id: string) {
    const data = await this.availabilityService.getMentorAvailability(id);
    return { success: true, data };
  }

  @Get(':id/slots')
  async getAvailableSlots(
    @Param('id') id: string,
    @Query('date') date: string,
  ) {
    const data = await this.availabilityService.getAvailableSlotsForDate(
      id,
      date || new Date().toISOString().split('T')[0],
    );
    return { success: true, data };
  }
}
