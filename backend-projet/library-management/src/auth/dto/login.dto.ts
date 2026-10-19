import { IsEmail, IsOptional, IsString, ValidateIf } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Email invalide' })
  email: string;

  // Accepte "motDePasse" (backend) ou "password" (frontend Rami)
  // Au moins l'un des deux doit être fourni
  @IsString()
  @ValidateIf((o) => !o.password)
  motDePasse?: string;

  @IsString()
  @ValidateIf((o) => !o.motDePasse)
  password?: string;
}
