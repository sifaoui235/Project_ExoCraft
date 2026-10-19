import { Module } from '@nestjs/common';
import { StatsController } from './stats.controller.js';
import { UserModule } from '../user/user.module.js';
import { MatiereModule } from '../matiere/matiere.module.js';
import { PromotionModule } from '../promotion/promotion.module.js';
import { ArchiveModule } from '../archive/archive.module.js';

@Module({
  imports: [UserModule, MatiereModule, PromotionModule, ArchiveModule],
  controllers: [StatsController],
})
export class StatsModule {}
