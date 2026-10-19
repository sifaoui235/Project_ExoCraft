import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateMatiereDto {
  @IsString()
  @IsNotEmpty()
  nom: string;

  @IsArray()
  @IsOptional()
  promoIds?: number[];

  @IsString()
  @IsOptional()
  description?: string;
}
