import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class EvaluatePromotionDto {
  @IsOptional()
  @IsString()
  customerGroup?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  declare cartAmount: number;

  @IsDateString()
  declare currentDate: string;
}
