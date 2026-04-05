import { PromotionRule } from '../../src/promotions/models/promotion-rule.model';
import { PromotionType } from '../../src/promotions/models/promotion-type.enum';

export function buildPromotion(
  overrides: Partial<PromotionRule> = {},
): PromotionRule {
  return {
    id: overrides.id ?? 'promotion-id',
    promotionName: overrides.promotionName ?? 'Promotion',
    promotionType: overrides.promotionType ?? PromotionType.Percentage,
    value: overrides.value ?? 10,
    active: overrides.active ?? true,
    validFrom: overrides.validFrom ?? '2025-12-01T00:00:00.000Z',
    validTo: overrides.validTo ?? '2026-12-31T23:59:59.999Z',
    priority: overrides.priority ?? 1,
    customerGroup: overrides.customerGroup,
    country: overrides.country,
    minimumCartAmount: overrides.minimumCartAmount,
    createdAt: overrides.createdAt ?? '2026-01-01T00:00:00.000Z',
  };
}
