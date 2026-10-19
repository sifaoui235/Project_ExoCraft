import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service.js';
import { UserService } from '../user/user.service.js';
import { CreateUserDto } from '../user/dto/create-user.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { Public } from './decorators/public.decorator.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  // Routes publiques : pas besoin de token
  @Public()
  @Post('register')
  register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Public()
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // GET /auth/me — retourne les infos du user connecté
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@CurrentUser() currentUser: { sub: number; email: string; role: string }) {
    const user = this.userService.findOne(currentUser.sub);
    if (!user) throw new UnauthorizedException('Utilisateur introuvable');
    const { motDePasseHash: _pwd, ...safe } = user;
    return safe;
  }

  // PATCH /auth/password — changer son mot de passe
  @UseGuards(JwtAuthGuard)
  @Patch('password')
  async changePassword(
    @CurrentUser() currentUser: { sub: number },
    @Body() body: { ancienMotDePasse: string; nouveauMotDePasse: string },
  ) {
    const user = this.userService.findOne(currentUser.sub);
    if (!user) throw new UnauthorizedException('Utilisateur introuvable');

    const isValid = await bcrypt.compare(body.ancienMotDePasse, user.motDePasseHash);
    if (!isValid) {
      throw new UnauthorizedException('Ancien mot de passe incorrect');
    }

    const hashed = await bcrypt.hash(body.nouveauMotDePasse, 10);
    this.userService.update(user.id, { motDePasseHash: hashed } as any);
    return { message: 'Mot de passe mis à jour' };
  }
}
