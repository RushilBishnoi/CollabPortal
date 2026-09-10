import { PartialType } from '@nestjs/swagger';
import { CreatePlacementOfferDto } from './create-placement-offer.dto';

export class UpdatePlacementOfferDto extends PartialType(CreatePlacementOfferDto) {}
