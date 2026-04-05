import { Module } from '@nestjs/common';
import { PromotionsModule } from './promotions/promotions.module';

@Module({
  imports: [PromotionsModule],
})
export class AppModule {}
