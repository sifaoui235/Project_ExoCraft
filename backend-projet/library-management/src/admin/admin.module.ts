import { Module } from '@nestjs/common';
import { AdminService } from './admin.service.js';
import { AdminController } from './admin.controller.js';
import { UserModule } from '../user/user.module.js';
import { ContentModule } from '../content/content.module.js';
import { QuizModule } from '../quiz/quiz.module.js';
import { ArchiveModule } from '../archive/archive.module.js';
import { MatiereModule } from '../matiere/matiere.module.js';
import { PromotionModule } from '../promotion/promotion.module.js';

@Module({
  imports: [
    UserModule,
    ContentModule,
    QuizModule,
    ArchiveModule,
    MatiereModule,
    PromotionModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
