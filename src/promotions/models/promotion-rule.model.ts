import { PromotionType } from './promotion-type.enum';

export interface PromotionRule {
  id: string;
  promotionName: string;
  promotionType: PromotionType;
  value: number;
  active: boolean;
  validFrom: string;
  validTo: string;
  priority: number;
  customerGroup?: string;
  country?: string;
  minimumCartAmount?: number;
  createdAt: string;
}
