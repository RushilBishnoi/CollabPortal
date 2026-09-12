import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import { CreatePlacementOfferDto } from '../dto/create-placement-offer.dto';
import { UpdatePlacementOfferDto } from '../dto/update-placement-offer.dto';
import { IssueOfferDto } from '../dto/issue-offer.dto';
import { QueryOffersDto } from '../dto/query-offers.dto';
import { UserRole } from '@prisma/client';

@Controller('industry')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IndustryPlacementsController {
  constructor(private readonly offersService: PlacementOffersService) {}

  @Post('applications/:applicationId/offers')
  @Roles(UserRole.INDUSTRY, UserRole.SUPER_ADMIN)
  async createOffer(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Param('applicationId') applicationId: string,
    @Body() dto: CreatePlacementOfferDto,
  ) {
    return this.offersService.createOffer(userId, userRole, applicationId, dto);
  }

  @Get('offers')
  @Roles(UserRole.INDUSTRY, UserRole.SUPER_ADMIN)
  async getOffers(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Query() query: QueryOffersDto,
  ) {
    return this.offersService.getIndustryOffers(userId, userRole, query);
  }

  @Get('offers/:id')
  @Roles(UserRole.INDUSTRY, UserRole.SUPER_ADMIN)
  async getOfferById(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Param('id') id: string,
  ) {
    return this.offersService.getIndustryOfferById(userId, userRole, id);
  }

  @Patch('offers/:id')
  @Roles(UserRole.INDUSTRY, UserRole.SUPER_ADMIN)
  async updateOffer(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Param('id') id: string,
    @Body() dto: UpdatePlacementOfferDto,
  ) {
    return this.offersService.updateOffer(userId, userRole, id, dto);
  }

  @Post('offers/:id/issue')
  @Roles(UserRole.INDUSTRY, UserRole.SUPER_ADMIN)
  async issueOffer(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Param('id') id: string,
    @Body() dto: IssueOfferDto,
  ) {
    return this.offersService.issueOffer(userId, userRole, id, dto?.notes);
  }

  @Post('offers/:id/withdraw')
  @Roles(UserRole.INDUSTRY, UserRole.SUPER_ADMIN)
  async withdrawOffer(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Param('id') id: string,
    @Body() dto: IssueOfferDto,
  ) {
    return this.offersService.withdrawOffer(userId, userRole, id, dto?.notes);
  }

  @Delete('offers/:id')
  @Roles(UserRole.INDUSTRY, UserRole.SUPER_ADMIN)
  async deleteOffer(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Param('id') id: string,
  ) {
    return this.offersService.deleteDraftOffer(userId, userRole, id);
  }
}
