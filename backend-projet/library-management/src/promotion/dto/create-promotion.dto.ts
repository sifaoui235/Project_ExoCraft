import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePromotionDto {
  @IsString()
  @IsNotEmpty({ message: 'Le nom de la promotion est obligatoire' })
  @MaxLength(100)
  nom: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description: string;
}
