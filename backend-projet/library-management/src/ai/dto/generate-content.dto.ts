import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export type ContentType = 'quiz' | 'cours' | 'resume' | 'serie' | 'examen';

export enum ContentTypeEnum {
  QUIZ = 'quiz',
  COURS = 'cours',
  RESUME = 'resume',
  SERIE = 'serie',
  EXAMEN = 'examen',
}

export enum NiveauEnum {
  DEBUTANT = 'debutant',
  INTERMEDIAIRE = 'intermediaire',
  AVANCE = 'avance',
}

export class GenerateContentDto {
  @IsString()
  @IsNotEmpty({ message: 'La matière est obligatoire' })
  matiere: string;

  @IsEnum(ContentTypeEnum, { message: 'Type invalide : quiz, cours, resume, serie ou examen' })
  type: ContentType;

  @IsString()
  @IsNotEmpty({ message: 'Le thème est obligatoire' })
  theme: string;

  @IsString()
  @IsOptional()
  courseFourni?: string;

  @IsInt()
  @Min(1)
  @Max(20)
  @IsOptional()
  nombreQuestions?: number;

  @IsEnum(NiveauEnum)
  @IsOptional()
  niveau?: 'debutant' | 'intermediaire' | 'avance';

  @IsString()
  @IsOptional()
  duree?: string;

  @IsString()
  @IsOptional()
  bareme?: string;
}
