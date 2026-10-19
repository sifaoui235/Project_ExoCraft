import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class CreateQuestionDto {
  @IsString()
  @IsNotEmpty({ message: 'L\'énoncé est obligatoire' })
  enonce: string;

  @IsString()
  @IsNotEmpty()
  choixA: string;

  @IsString()
  @IsNotEmpty()
  choixB: string;

  @IsString()
  @IsNotEmpty()
  choixC: string;

  @IsString()
  @IsNotEmpty()
  choixD: string;

  @IsEnum(['A', 'B', 'C', 'D'], { message: 'La réponse correcte doit être A, B, C ou D' })
  reponseCorrecte: 'A' | 'B' | 'C' | 'D';

  @IsString()
  @IsNotEmpty({ message: 'L\'explication est obligatoire' })
  explication: string;
}
