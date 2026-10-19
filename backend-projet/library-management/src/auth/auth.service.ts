import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service.js';
import { CreateUserDto } from '../user/dto/create-user.dto.js';
import { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async register(createUserDto: CreateUserDto) {
    // Normaliser les champs : accepte firstName/lastName (Rami) ou nom/prenom (backend)
    const nom    = createUserDto.nom    || createUserDto.lastName  || '';
    const prenom = createUserDto.prenom || createUserDto.firstName || '';
    const motDePasse = createUserDto.motDePasse || createUserDto.password || '';
    const email  = createUserDto.email;
    const role   = createUserDto.role || 'enseignant' as any;
    const associations = createUserDto.associations || [];

    if (!nom || !prenom || !motDePasse) {
      throw new ConflictException('Nom, prénom et mot de passe sont obligatoires');
    }

    const existingUser = this.userService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    const hashedPassword = await bcrypt.hash(motDePasse, 10);

    const newUser = this.userService.create({
      nom,
      prenom,
      email,
      motDePasse: hashedPassword,
      role,
      associations,
    } as any);

    const payload = { sub: newUser.id, email: newUser.email, role: newUser.role };
    const token   = await this.jwtService.signAsync(payload);

    return {
      access_token: token,
      user: {
        id:           newUser.id,
        nom:          newUser.nom,
        prenom:       newUser.prenom,
        // aliases pour Rami
        lastName:     newUser.nom,
        firstName:    newUser.prenom,
        email:        newUser.email,
        role:         newUser.role,
        associations: (newUser as any).associations || [],
      },
    };
  }

  async login(loginDto: LoginDto) {
    // Accepte "motDePasse" ou "password"
    const motDePasse = loginDto.motDePasse || (loginDto as any).password || '';

    const user = this.userService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const isPasswordValid = await bcrypt.compare(motDePasse, user.motDePasseHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const token   = await this.jwtService.signAsync(payload);

    return {
      access_token: token,
      user: {
        id:           user.id,
        nom:          user.nom,
        prenom:       user.prenom,
        // aliases pour Rami
        lastName:     user.nom,
        firstName:    user.prenom,
        email:        user.email,
        role:         user.role,
        associations: (user as any).associations || [],
      },
    };
  }
}
