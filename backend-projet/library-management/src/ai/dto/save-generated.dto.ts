import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ContentTypeEnum } from './generate-content.dto.js';

export class SaveGeneratedDto {
  @IsString()
  @IsNotEmpty()
  titre: string;

  @IsEnum(ContentTypeEnum, { message: 'Type invalide : quiz, cours, resume, serie ou examen' })
  type: string;

  @IsString()
  @IsNotEmpty()
  matiere: string;

  @IsString()
  @IsNotEmpty()
  theme: string;

  @IsString()
  @IsNotEmpty({ message: 'Le contenu généré est obligatoire' })
  contenu: string;
}
