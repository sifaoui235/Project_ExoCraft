import { Module } from '@nestjs/common';
import { AiService } from './ai.service.js';
import { AiController } from './ai.controller.js';
import { ArchiveModule } from '../archive/archive.module.js';
import { ContentModule } from '../content/content.module.js';
import { QuizModule } from '../quiz/quiz.module.js';

@Module({
  imports: [ArchiveModule, ContentModule, QuizModule],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
