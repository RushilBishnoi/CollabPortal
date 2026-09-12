import {
  Controller,
  Get,
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
import { PlacementOffersService } from '../services/placement-offers.service';
import { PlacementsService } from '../services/placements.service';
import { AcceptOfferDto, DeclineOfferDto } from '../dto/student-offer-response.dto';
import { QueryOffersDto } from '../dto/query-offers.dto';
import { UserRole } from '@prisma/client';

@Controller('student')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentPlacementsController {
  constructor(
    private readonly offersService: PlacementOffersService,
    private readonly placementsService: PlacementsService,
  ) {}

  @Get('offers')
  @Roles(UserRole.STUDENT)
  async getOffers(
    @CurrentUser('id') userId: string,
    @Query() query: QueryOffersDto,
  ) {
    return this.offersService.getStudentOffers(userId, query);
  }

  @Get('offers/:id')
  @Roles(UserRole.STUDENT)
  async getOfferById(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.offersService.getStudentOfferById(userId, id);
  }

  @Post('offers/:id/accept')
  @Roles(UserRole.STUDENT, UserRole.SUPER_ADMIN)
  async acceptOffer(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Param('id') id: string,
    @Body() dto: AcceptOfferDto,
  ) {
    return this.offersService.acceptOffer(userId, userRole, id, dto?.notes);
  }

  @Post('offers/:id/decline')
  @Roles(UserRole.STUDENT, UserRole.SUPER_ADMIN)
  async declineOffer(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Param('id') id: string,
    @Body() dto: DeclineOfferDto,
  ) {
    return this.offersService.declineOffer(userId, userRole, id, dto);
  }

  @Get('placements/me')
  @Roles(UserRole.STUDENT)
  async getMyPlacements(@CurrentUser('id') userId: string) {
    return this.placementsService.getStudentPlacements(userId);
  }
}
