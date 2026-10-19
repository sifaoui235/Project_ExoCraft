import { Module } from '@nestjs/common';
import { ExportService } from './export.service.js';
import { ExportController } from './export.controller.js';
import { ContentModule } from '../content/content.module.js';
import { QuizModule } from '../quiz/quiz.module.js';

@Module({
  imports: [ContentModule, QuizModule],
  controllers: [ExportController],
  providers: [ExportService],
})
export class ExportModule {}
