import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PromotionType } from '../models/promotion-type.enum';
import { IsOnOrAfter } from './validators/is-on-or-after.decorator';

export class CreatePromotionDto {
  @IsString()
  declare promotionName: string;

  @IsEnum(PromotionType)
  declare promotionType: PromotionType;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  declare value: number;

  @IsDateString()
  declare validFrom: string;

  @IsDateString()
  @IsOnOrAfter('validFrom', {
    message: 'validTo must be on or after validFrom',
  })
  declare validTo: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  declare priority: number;

  @IsOptional()
  @IsString()
  customerGroup?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  minimumCartAmount?: number;
}
