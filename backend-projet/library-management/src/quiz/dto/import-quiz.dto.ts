import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateQuestionDto } from './create-question.dto.js';
import { NiveauQuiz } from './create-quiz.dto.js';

export class ImportQuizDto {
  @IsString()
  @IsNotEmpty()
  titre: string;

  @IsString()
  @IsNotEmpty()
  theme: string;

  @IsString()
  @IsNotEmpty()
  matiere: string;

  @IsEnum(NiveauQuiz)
  @IsOptional()
  niveau?: NiveauQuiz;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  questions: CreateQuestionDto[];
}
