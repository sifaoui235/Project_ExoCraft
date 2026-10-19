import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum NiveauQuiz {
  DEBUTANT = 'debutant',
  INTERMEDIAIRE = 'intermediaire',
  AVANCE = 'avance',
}

export enum VisibiliteQuiz {
  PRIVE = 'prive',
  PUBLIC = 'public',
}

export class CreateQuizDto {
  @IsString()
  @IsNotEmpty({ message: 'Le titre est obligatoire' })
  titre: string;

  @IsString()
  @IsNotEmpty({ message: 'Le thème est obligatoire' })
  theme: string;

  @IsString()
  @IsNotEmpty({ message: 'La matière est obligatoire' })
  matiere: string;

  @IsEnum(NiveauQuiz, { message: 'Niveau invalide : debutant, intermediaire ou avance' })
  @IsOptional()
  niveau?: NiveauQuiz;

  @IsEnum(VisibiliteQuiz, { message: 'Visibilité invalide : prive ou public' })
  @IsOptional()
  visibilite?: VisibiliteQuiz;
}
