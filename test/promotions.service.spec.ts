import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EvaluatePromotionDto } from '../src/promotions/dto/evaluate-promotion.dto';
import {
  PROMOTIONS_REPOSITORY,
  PromotionsRepository,
} from '../src/promotions/promotions.repository';
import { PromotionsService } from '../src/promotions/promotions.service';
import { buildPromotion } from './factories/promotion.factory';

describe('PromotionsService', () => {
  let service: PromotionsService;
  let repository: jest.Mocked<PromotionsRepository>;

  const evaluation: EvaluatePromotionDto = {
    customerGroup: 'vip',
    country: 'DE',
    cartAmount: 250,
    currentDate: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(async () => {
    repository = {
      list: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      updateOne: jest.fn(),
      saveAll: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        PromotionsService,
        {
          provide: PROMOTIONS_REPOSITORY,
          useValue: repository,
        },
      ],
    }).compile();

    service = moduleRef.get(PromotionsService);
  });

  it('should exclude inactive promotions', async () => {
    repository.list.mockResolvedValue([
      buildPromotion({ id: 'inactive', active: false }),
    ]);

    await expect(service.evaluate(evaluation)).resolves.toBeNull();
  });

  it('should exclude expired promotions', async () => {
    repository.list.mockResolvedValue([
      buildPromotion({
        id: 'expired',
        validFrom: '2025-01-01T00:00:00.000Z',
        validTo: '2025-12-31T23:59:59.999Z',
      }),
    ]);

    await expect(service.evaluate(evaluation)).resolves.toBeNull();
  });

  it('should treat missing optional conditions as no restriction', async () => {
    const promotion = buildPromotion({
      id: 'generic',
      customerGroup: undefined,
      country: undefined,
      minimumCartAmount: undefined,
    });
    repository.list.mockResolvedValue([promotion]);

    await expect(service.evaluate(evaluation)).resolves.toEqual(promotion);
  });

  it('should enforce minimum cart amount when defined', async () => {
    repository.list.mockResolvedValue([
      buildPromotion({ id: 'too-high', minimumCartAmount: 300 }),
    ]);

    await expect(service.evaluate(evaluation)).resolves.toBeNull();
  });

  it('should exclude promotions when customerGroup does not match', async () => {
    repository.list.mockResolvedValue([
      buildPromotion({ id: 'group-mismatch', customerGroup: 'new' }),
    ]);

    await expect(service.evaluate(evaluation)).resolves.toBeNull();
  });

  it('should exclude promotions when country does not match', async () => {
    repository.list.mockResolvedValue([
      buildPromotion({ id: 'country-mismatch', country: 'FR' }),
    ]);

    await expect(service.evaluate(evaluation)).resolves.toBeNull();
  });

  it('should exclude promotions that are not yet valid', async () => {
    repository.list.mockResolvedValue([
      buildPromotion({
        id: 'future',
        validFrom: '2026-02-01T00:00:00.000Z',
        validTo: '2026-12-31T23:59:59.999Z',
      }),
    ]);

    await expect(service.evaluate(evaluation)).resolves.toBeNull();
  });

  it('should prefer higher priority', async () => {
    const lower = buildPromotion({ id: 'lower', priority: 2 });
    const higher = buildPromotion({ id: 'higher', priority: 5 });
    repository.list.mockResolvedValue([lower, higher]);

    await expect(service.evaluate(evaluation)).resolves.toEqual(higher);
  });

  it('should use higher minimumCartAmount as the second tie-breaker when both define it', async () => {
    const lowerThreshold = buildPromotion({
      id: 'lower-threshold',
      priority: 5,
      minimumCartAmount: 100,
    });
    const higherThreshold = buildPromotion({
      id: 'higher-threshold',
      priority: 5,
      minimumCartAmount: 200,
    });
    repository.list.mockResolvedValue([lowerThreshold, higherThreshold]);

    await expect(service.evaluate(evaluation)).resolves.toEqual(
      higherThreshold,
    );
  });

  it('should prefer the more specific rule when priority and minimumCartAmount tie', async () => {
    const generic = buildPromotion({
      id: 'generic',
      priority: 5,
      minimumCartAmount: 100,
      customerGroup: undefined,
    });
    const specific = buildPromotion({
      id: 'specific',
      priority: 5,
      minimumCartAmount: 100,
      customerGroup: 'vip',
    });
    repository.list.mockResolvedValue([generic, specific]);

    await expect(service.evaluate(evaluation)).resolves.toEqual(specific);
  });

  it('should prefer the latest created rule when all other tie-breakers are equal', async () => {
    const earlier = buildPromotion({
      id: 'earlier',
      priority: 5,
      minimumCartAmount: 100,
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    const later = buildPromotion({
      id: 'later',
      priority: 5,
      minimumCartAmount: 100,
      createdAt: '2026-01-02T00:00:00.000Z',
    });
    repository.list.mockResolvedValue([earlier, later]);

    await expect(service.evaluate(evaluation)).resolves.toEqual(later);
  });

  it('should return null when nothing matches', async () => {
    repository.list.mockResolvedValue([
      buildPromotion({ id: 'country-mismatch', country: 'FR' }),
    ]);

    await expect(service.evaluate(evaluation)).resolves.toBeNull();
  });

  it('should deactivate a promotion and persist the change', async () => {
    const activePromotion = buildPromotion({ id: 'promo-1', active: true });
    repository.findOne.mockResolvedValue(activePromotion);
    repository.updateOne.mockResolvedValue({
      ...activePromotion,
      active: false,
    });

    const result = await service.deactivate('promo-1');

    expect(result.active).toBe(false);
    expect(repository.updateOne.mock.calls[0]?.[0]).toEqual({
      ...activePromotion,
      active: false,
    });
    expect(repository.list.mock.calls).toHaveLength(0);
    expect(repository.saveAll.mock.calls).toHaveLength(0);
  });

  it('should throw when trying to deactivate a missing promotion', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(service.deactivate('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repository.list.mock.calls).toHaveLength(0);
    expect(repository.updateOne.mock.calls).toHaveLength(0);
    expect(repository.saveAll.mock.calls).toHaveLength(0);
  });

  it('should not persist when deactivating an already inactive promotion', async () => {
    const inactivePromotion = buildPromotion({ id: 'promo-2', active: false });
    repository.findOne.mockResolvedValue(inactivePromotion);

    const result = await service.deactivate('promo-2');

    expect(result).toEqual(inactivePromotion);
    expect(repository.list.mock.calls).toHaveLength(0);
    expect(repository.updateOne.mock.calls).toHaveLength(0);
    expect(repository.saveAll.mock.calls).toHaveLength(0);
  });
});
