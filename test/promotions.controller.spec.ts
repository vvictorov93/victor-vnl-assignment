import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CreatePromotionDto } from '../src/promotions/dto/create-promotion.dto';
import { EvaluatePromotionDto } from '../src/promotions/dto/evaluate-promotion.dto';
import { PromotionType } from '../src/promotions/models/promotion-type.enum';
import { PromotionsController } from '../src/promotions/promotions.controller';
import { PromotionsService } from '../src/promotions/promotions.service';
import { buildPromotion } from './factories/promotion.factory';

describe('PromotionsController', () => {
  let controller: PromotionsController;
  let service: jest.Mocked<PromotionsService>;

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      list: jest.fn(),
      deactivate: jest.fn(),
      evaluate: jest.fn(),
    } as unknown as jest.Mocked<PromotionsService>;

    const moduleRef = await Test.createTestingModule({
      controllers: [PromotionsController],
      providers: [
        {
          provide: PromotionsService,
          useValue: service,
        },
      ],
    }).compile();

    controller = moduleRef.get(PromotionsController);
  });

  it('should delegate create to the service', async () => {
    const createPromotionDto: CreatePromotionDto = {
      promotionName: 'VIP Discount',
      promotionType: PromotionType.Percentage,
      value: 15,
      validFrom: '2025-12-15T00:00:00.000Z',
      validTo: '2026-01-15T23:59:59.999Z',
      priority: 10,
      customerGroup: 'vip',
      country: 'DE',
      minimumCartAmount: 200,
    };
    const promotion = buildPromotion({
      id: 'created',
      ...createPromotionDto,
    });
    service.create.mockResolvedValue(promotion);

    await expect(controller.create(createPromotionDto)).resolves.toEqual(
      promotion,
    );
    expect(service.create.mock.calls).toEqual([[createPromotionDto]]);
  });

  it('should delegate list to the service', async () => {
    const promotions = [
      buildPromotion({ id: 'one' }),
      buildPromotion({ id: 'two' }),
    ];
    service.list.mockResolvedValue(promotions);

    await expect(controller.list()).resolves.toEqual(promotions);
    expect(service.list.mock.calls).toHaveLength(1);
  });

  it('should delegate deactivate to the service', async () => {
    const promotion = buildPromotion({ id: 'promo-1', active: false });
    service.deactivate.mockResolvedValue(promotion);

    await expect(controller.deactivate('promo-1')).resolves.toEqual(promotion);
    expect(service.deactivate.mock.calls).toEqual([['promo-1']]);
  });

  it('should delegate evaluate to the service', async () => {
    const evaluatePromotionDto: EvaluatePromotionDto = {
      customerGroup: 'vip',
      country: 'DE',
      cartAmount: 250,
      currentDate: '2026-01-01T00:00:00.000Z',
    };
    const promotion = buildPromotion({ id: 'winner' });
    service.evaluate.mockResolvedValue(promotion);

    await expect(controller.evaluate(evaluatePromotionDto)).resolves.toEqual(
      promotion,
    );
    expect(service.evaluate.mock.calls).toEqual([[evaluatePromotionDto]]);
  });

  it('should return null from evaluate when the service finds no match', async () => {
    const evaluatePromotionDto: EvaluatePromotionDto = {
      customerGroup: 'vip',
      country: 'DE',
      cartAmount: 250,
      currentDate: '2026-01-01T00:00:00.000Z',
    };
    service.evaluate.mockResolvedValue(null);

    await expect(controller.evaluate(evaluatePromotionDto)).resolves.toBeNull();
    expect(service.evaluate.mock.calls).toEqual([[evaluatePromotionDto]]);
  });

  it('should propagate an error when deactivate fails', async () => {
    const error = new NotFoundException('Promotion missing');
    service.deactivate.mockRejectedValue(error);

    await expect(controller.deactivate('missing')).rejects.toBe(error);
    expect(service.deactivate.mock.calls).toEqual([['missing']]);
  });

  it('should propagate an error when create fails', async () => {
    const createPromotionDto: CreatePromotionDto = {
      promotionName: 'VIP Discount',
      promotionType: PromotionType.Percentage,
      value: 15,
      validFrom: '2025-12-15T00:00:00.000Z',
      validTo: '2026-01-15T23:59:59.999Z',
      priority: 10,
      customerGroup: 'vip',
      country: 'DE',
      minimumCartAmount: 200,
    };
    const error = new Error('Create failed');
    service.create.mockRejectedValue(error);

    await expect(controller.create(createPromotionDto)).rejects.toBe(error);
    expect(service.create.mock.calls).toEqual([[createPromotionDto]]);
  });
});
