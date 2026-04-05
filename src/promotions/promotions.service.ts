import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { EvaluatePromotionDto } from './dto/evaluate-promotion.dto';
import { PromotionRule } from './models/promotion-rule.model';
import {
  PROMOTIONS_REPOSITORY,
  PromotionsRepository,
} from './promotions.repository';

@Injectable()
export class PromotionsService {
  constructor(
    @Inject(PROMOTIONS_REPOSITORY)
    private readonly promotionsRepository: PromotionsRepository,
  ) {}

  async create(createPromotionDto: CreatePromotionDto): Promise<PromotionRule> {
    const promotion: PromotionRule = {
      ...createPromotionDto,
      id: randomUUID(),
      active: true,
      createdAt: new Date().toISOString(),
    };

    return this.promotionsRepository.create(promotion);
  }

  async list(): Promise<PromotionRule[]> {
    return this.promotionsRepository.list();
  }

  async deactivate(id: string): Promise<PromotionRule> {
    const promotions = await this.promotionsRepository.list();
    const promotion = promotions.find((candidate) => candidate.id === id);

    if (!promotion) {
      throw new NotFoundException(`Promotion ${id} not found`);
    }

    if (!promotion.active) {
      return promotion;
    }

    promotion.active = false;
    await this.promotionsRepository.saveAll(promotions);
    return promotion;
  }

  async evaluate(
    evaluatePromotionDto: EvaluatePromotionDto,
  ): Promise<PromotionRule | null> {
    const promotions = await this.promotionsRepository.list();
    const matches = promotions.filter((promotion) =>
      this.matchesPromotion(promotion, evaluatePromotionDto),
    );

    if (matches.length === 0) {
      return null;
    }

    return matches.reduce((winner, candidate) =>
      this.comparePromotions(candidate, winner) > 0 ? candidate : winner,
    );
  }

  private matchesPromotion(
    promotion: PromotionRule,
    evaluation: EvaluatePromotionDto,
  ): boolean {
    if (!promotion.active) {
      return false;
    }

    const currentDate = new Date(evaluation.currentDate).getTime();
    const validFrom = new Date(promotion.validFrom).getTime();
    const validTo = new Date(promotion.validTo).getTime();

    if (currentDate < validFrom || currentDate > validTo) {
      return false;
    }

    if (
      promotion.customerGroup !== undefined &&
      promotion.customerGroup !== evaluation.customerGroup
    ) {
      return false;
    }

    if (
      promotion.country !== undefined &&
      promotion.country !== evaluation.country
    ) {
      return false;
    }

    if (
      promotion.minimumCartAmount !== undefined &&
      evaluation.cartAmount < promotion.minimumCartAmount
    ) {
      return false;
    }

    return true;
  }

  private comparePromotions(
    candidate: PromotionRule,
    currentWinner: PromotionRule,
  ): number {
    if (candidate.priority !== currentWinner.priority) {
      return candidate.priority - currentWinner.priority;
    }

    const candidateHasMinimum = candidate.minimumCartAmount !== undefined;
    const currentWinnerHasMinimum =
      currentWinner.minimumCartAmount !== undefined;

    if (candidateHasMinimum && currentWinnerHasMinimum) {
      const difference =
        candidate.minimumCartAmount! - currentWinner.minimumCartAmount!;

      if (difference !== 0) {
        return difference;
      }
    }

    const specificityDifference =
      this.getSpecificity(candidate) - this.getSpecificity(currentWinner);

    if (specificityDifference !== 0) {
      return specificityDifference;
    }

    return (
      new Date(candidate.createdAt).getTime() -
      new Date(currentWinner.createdAt).getTime()
    );
  }

  private getSpecificity(promotion: PromotionRule): number {
    return [
      promotion.customerGroup,
      promotion.country,
      promotion.minimumCartAmount,
    ].filter((value) => value !== undefined).length;
  }
}
