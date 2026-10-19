import { Module } from '@nestjs/common';
import { QuizService } from './quiz.service.js';
import { QuizController } from './quiz.controller.js';

@Module({
  controllers: [QuizController],
  providers: [QuizService],
  exports: [QuizService],
})
export class QuizModule {}
