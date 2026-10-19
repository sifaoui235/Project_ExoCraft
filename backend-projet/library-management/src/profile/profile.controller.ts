import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { UserService } from '../user/user.service.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly userService: UserService) {}

  // GET /profile
  @Get()
  getProfile(@CurrentUser() currentUser: { sub: number }) {
    const user = this.userService.findOne(currentUser.sub);
    if (!user) throw new UnauthorizedException('Utilisateur introuvable');
    return {
      id: user.id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      role: user.role,
      avatar: user.avatar ?? null,
      bio: user.bio ?? '',
    };
  }

  // PUT /profile
  @Put()
  updateProfile(
    @CurrentUser() currentUser: { sub: number },
    @Body() body: { nom?: string; prenom?: string; bio?: string },
  ) {
    const user = this.userService.findOne(currentUser.sub);
    if (!user) throw new UnauthorizedException('Utilisateur introuvable');
    const updated = this.userService.update(currentUser.sub, body as any);
    if (!updated) throw new UnauthorizedException('Utilisateur introuvable');
    return {
      id: updated.id,
      nom: updated.nom,
      prenom: updated.prenom,
      email: updated.email,
      role: updated.role,
      avatar: updated.avatar ?? null,
      bio: updated.bio ?? '',
    };
  }

  // POST /profile/avatar
  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads', 'avatars'),
        filename: (_req, file, cb) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, unique + extname(file.originalname));
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadAvatar(
    @CurrentUser() currentUser: { sub: number },
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new UnauthorizedException('Aucun fichier fourni');
    const avatarUrl = `/uploads/avatars/${file.filename}`;
    this.userService.update(currentUser.sub, { avatar: avatarUrl } as any);
    return { avatarUrl };
  }
}
