import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateMatiereDto {
  @IsString()
  @IsNotEmpty({ message: 'Le nom de la matière est obligatoire' })
  @MaxLength(100)
  nom: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description: string;
}
