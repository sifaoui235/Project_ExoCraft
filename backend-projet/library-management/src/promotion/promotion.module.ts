import { Module } from '@nestjs/common';
import { PromotionService } from './promotion.service.js';
import { PromotionController } from './promotion.controller.js';
import { PromoAliasController } from './promo-alias.controller.js';

@Module({
  controllers: [PromotionController, PromoAliasController],
  providers: [PromotionService],
  exports: [PromotionService],
})
export class PromotionModule {}
