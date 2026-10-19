import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePromotionDto {
  @IsString()
  @IsNotEmpty()
  nom: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  niveau?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  specialite?: string | null;

  @IsString()
  @IsOptional()
  semestre?: string;

  @IsString()
  @IsOptional()
  etablissementType?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
