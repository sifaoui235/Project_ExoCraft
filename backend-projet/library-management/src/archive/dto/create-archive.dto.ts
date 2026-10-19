import { IsNotEmpty, IsString } from 'class-validator';

export class CreateArchiveDto {
  @IsString()
  @IsNotEmpty({ message: 'La matière est obligatoire' })
  matiere: string;

  @IsString()
  @IsNotEmpty({ message: 'La promotion est obligatoire' })
  promotion: string;
}
