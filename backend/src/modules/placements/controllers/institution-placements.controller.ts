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
import { PlacementsService } from '../services/placements.service';
import { VerifyPlacementDto, RevokePlacementDto } from '../dto/verify-placement.dto';
import { ConfirmJoiningDto } from '../dto/confirm-joining.dto';
import { QueryPlacementsDto } from '../dto/query-placements.dto';
import { UserRole } from '@prisma/client';

@Controller('institution')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InstitutionPlacementsController {
  constructor(private readonly placementsService: PlacementsService) {}

  @Get('placements')
  @Roles(UserRole.INSTITUTION_ADMIN, UserRole.SUPER_ADMIN)
  async getPlacements(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Query() query: QueryPlacementsDto,
  ) {
    return this.placementsService.getInstitutionPlacements(userId, userRole, query);
  }

  @Get('placements/:id')
  @Roles(UserRole.INSTITUTION_ADMIN, UserRole.SUPER_ADMIN)
  async getPlacementById(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Param('id') id: string,
  ) {
    return this.placementsService.getInstitutionPlacementById(userId, userRole, id);
  }

  @Post('placements/:id/verify')
  @Roles(UserRole.INSTITUTION_ADMIN, UserRole.SUPER_ADMIN)
  async verifyPlacement(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Param('id') id: string,
    @Body() dto: VerifyPlacementDto,
  ) {
    return this.placementsService.verifyPlacement(userId, userRole, id, dto);
  }

  @Post('placements/:id/confirm-joining')
  @Roles(UserRole.INSTITUTION_ADMIN, UserRole.SUPER_ADMIN)
  async confirmJoining(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Param('id') id: string,
    @Body() dto: ConfirmJoiningDto,
  ) {
    return this.placementsService.confirmJoining(userId, userRole, id, dto);
  }

  @Post('placements/:id/revoke')
  @Roles(UserRole.INSTITUTION_ADMIN, UserRole.SUPER_ADMIN)
  async revokePlacement(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Param('id') id: string,
    @Body() dto: RevokePlacementDto,
  ) {
    return this.placementsService.revokePlacement(userId, userRole, id, dto);
  }
}
