import { promises as fs } from 'fs';
import { join } from 'path';
import { FilePromotionsRepository } from '../src/promotions/promotions.repository';
import { buildPromotion } from './factories/promotion.factory';

jest.mock('fs', () => ({
  promises: {
    access: jest.fn(),
    mkdir: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn(),
  },
}));

describe('FilePromotionsRepository', () => {
  const mockedFs = jest.mocked(fs);
  const expectedFilePath = join(process.cwd(), 'data', 'promotions.json');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create the data file on first list when it does not exist', async () => {
    const repository = new FilePromotionsRepository();
    mockedFs.access.mockRejectedValueOnce(new Error('missing'));
    mockedFs.readFile.mockResolvedValueOnce('[]');

    await expect(repository.list()).resolves.toEqual([]);

    expect(mockedFs.mkdir).toHaveBeenCalledWith(join(process.cwd(), 'data'), {
      recursive: true,
    });
    expect(mockedFs.writeFile).toHaveBeenCalledWith(
      expectedFilePath,
      '[]',
      'utf-8',
    );
  });

  it('should persist a created promotion', async () => {
    const repository = new FilePromotionsRepository();
    const promotion = buildPromotion({ id: 'created-promotion' });
    mockedFs.access.mockResolvedValue(undefined);
    mockedFs.readFile.mockResolvedValueOnce('[]');

    await expect(repository.create(promotion)).resolves.toEqual(promotion);

    expect(mockedFs.writeFile).toHaveBeenLastCalledWith(
      expectedFilePath,
      `${JSON.stringify([promotion], null, 2)}\n`,
      'utf-8',
    );
  });

  it('should save all provided promotions', async () => {
    const repository = new FilePromotionsRepository();
    const promotions = [
      buildPromotion({ id: 'one' }),
      buildPromotion({ id: 'two', active: false }),
    ];
    mockedFs.access.mockResolvedValue(undefined);

    await repository.saveAll(promotions);

    expect(mockedFs.writeFile).toHaveBeenLastCalledWith(
      expectedFilePath,
      `${JSON.stringify(promotions, null, 2)}\n`,
      'utf-8',
    );
  });

  it('should return defensive copies from list', async () => {
    const repository = new FilePromotionsRepository();
    const promotion = buildPromotion({ id: 'copy-check' });
    mockedFs.access.mockResolvedValue(undefined);
    mockedFs.readFile.mockResolvedValueOnce(JSON.stringify([promotion]));

    const listedPromotions = await repository.list();
    listedPromotions[0].active = false;

    await expect(repository.list()).resolves.toEqual([promotion]);
  });

  it('should reject when the data file contains invalid json', async () => {
    const repository = new FilePromotionsRepository();
    mockedFs.access.mockResolvedValue(undefined);
    mockedFs.readFile.mockResolvedValueOnce('{invalid json');

    await expect(repository.list()).rejects.toThrow(SyntaxError);
  });
});
