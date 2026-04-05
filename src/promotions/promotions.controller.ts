import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { EvaluatePromotionDto } from './dto/evaluate-promotion.dto';
import { PromotionRule } from './models/promotion-rule.model';
import { PromotionsService } from './promotions.service';

@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Post()
  create(
    @Body() createPromotionDto: CreatePromotionDto,
  ): Promise<PromotionRule> {
    return this.promotionsService.create(createPromotionDto);
  }

  @Get()
  list(): Promise<PromotionRule[]> {
    return this.promotionsService.list();
  }

  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string): Promise<PromotionRule> {
    return this.promotionsService.deactivate(id);
  }

  @Post('evaluate')
  evaluate(
    @Body() evaluatePromotionDto: EvaluatePromotionDto,
  ): Promise<PromotionRule | null> {
    return this.promotionsService.evaluate(evaluatePromotionDto);
  }
}
