import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export enum Role {
  ENSEIGNANT = 'enseignant',
  ADMINISTRATEUR = 'administrateur',
}

export class CreateUserDto {
  // Accepte "nom" (backend) ou "lastName" (frontend Rami)
  @IsString()
  @IsOptional()
  nom?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  // Accepte "prenom" (backend) ou "firstName" (frontend Rami)
  @IsString()
  @IsOptional()
  prenom?: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsEmail({}, { message: 'Email invalide' })
  email: string;

  // Accepte "motDePasse" (backend) ou "password" (frontend Rami)
  @IsString()
  @IsOptional()
  motDePasse?: string;

  @IsString()
  @IsOptional()
  @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' })
  password?: string;

  @IsEnum(Role, { message: 'Le rôle doit être "enseignant" ou "administrateur"' })
  @IsOptional()
  role?: Role;

  // associations envoyées par Rami (classes + sections)
  @IsOptional()
  associations?: Array<{ className: string; section: string }>;
}
