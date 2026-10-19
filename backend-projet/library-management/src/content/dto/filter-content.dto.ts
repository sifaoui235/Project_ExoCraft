import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterContentDto {
  @IsEnum(['cours', 'resume', 'serie', 'examen'])
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  matiere?: string;

  @IsEnum(['brouillon', 'valide'])
  @IsOptional()
  statut?: string;

  @IsEnum(['prive', 'public'])
  @IsOptional()
  visibilite?: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  limit?: number;
}
