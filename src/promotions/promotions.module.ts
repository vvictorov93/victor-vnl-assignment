import { Module } from '@nestjs/common';
import { PromotionsController } from './promotions.controller';
import {
  FilePromotionsRepository,
  PROMOTIONS_REPOSITORY,
} from './promotions.repository';
import { PromotionsService } from './promotions.service';

@Module({
  controllers: [PromotionsController],
  providers: [
    PromotionsService,
    {
      provide: PROMOTIONS_REPOSITORY,
      useClass: FilePromotionsRepository,
    },
  ],
})
export class PromotionsModule {}
