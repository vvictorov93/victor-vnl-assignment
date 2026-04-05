import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import { PromotionRule } from './models/promotion-rule.model';

export const PROMOTIONS_REPOSITORY = Symbol('PROMOTIONS_REPOSITORY');

export interface PromotionsRepository {
  list(): Promise<PromotionRule[]>;
  create(promotion: PromotionRule): Promise<PromotionRule>;
  saveAll(promotions: PromotionRule[]): Promise<void>;
}

@Injectable()
export class FilePromotionsRepository implements PromotionsRepository {
  private readonly filePath = join(process.cwd(), 'data', 'promotions.json');
  private promotionsCache: PromotionRule[] | null = null;

  async list(): Promise<PromotionRule[]> {
    const promotions = await this.load();
    return promotions.map((promotion) => ({ ...promotion }));
  }

  async create(promotion: PromotionRule): Promise<PromotionRule> {
    const promotions = await this.load();
    promotions.push(promotion);
    await this.persist(promotions);
    return { ...promotion };
  }

  async saveAll(promotions: PromotionRule[]): Promise<void> {
    await this.persist(promotions);
  }

  private async load(): Promise<PromotionRule[]> {
    if (this.promotionsCache) {
      return this.promotionsCache;
    }

    await this.ensureDataFile();

    const fileContents = await fs.readFile(this.filePath, 'utf-8');
    const parsed = JSON.parse(fileContents) as PromotionRule[];
    this.promotionsCache = parsed;
    return this.promotionsCache;
  }

  private async ensureDataFile(): Promise<void> {
    await fs.mkdir(dirname(this.filePath), { recursive: true });

    try {
      await fs.access(this.filePath);
    } catch {
      await fs.writeFile(this.filePath, '[]', 'utf-8');
    }
  }

  private async persist(promotions: PromotionRule[]): Promise<void> {
    this.promotionsCache = promotions.map((promotion) => ({ ...promotion }));
    await this.ensureDataFile();
    await fs.writeFile(
      this.filePath,
      `${JSON.stringify(this.promotionsCache, null, 2)}\n`,
      'utf-8',
    );
  }
}
