import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UploadedFile,
  UseInterceptors,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Res,
  NotFoundException,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync } from 'fs';
import { ArchiveService } from './archive.service.js';
import { CreateArchiveDto } from './dto/create-archive.dto.js';

@Controller('archives')
export class ArchiveController {
  constructor(private readonly archiveService: ArchiveService) {}

  // POST /archives/upload — dépôt d'un fichier par l'admin
  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('fichier', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads', 'archives'),
        filename: (_req, file, cb) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, unique + extname(file.originalname));
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
      fileFilter: (_req, file, cb) => {
        const allowed = ['.pdf', '.doc', '.docx'];
        if (allowed.includes(extname(file.originalname).toLowerCase())) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Seuls PDF et Word sont acceptés'), false);
        }
      },
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateArchiveDto,
  ) {
    if (!file) throw new BadRequestException('Aucun fichier fourni');
    return this.archiveService.upload(file, dto);
  }

  // GET /archives?matiere=Info&promotion=2TWIN1&page=1&limit=10
  @Get()
  findAll(
    @Query('matiere') matiere?: string,
    @Query('promotion') promotion?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.archiveService.findAll(matiere, promotion, page ? +page : 1, limit ? +limit : 10);
  }

  // GET /archives/enseignant — archives filtrées pour un enseignant
  @Get('enseignant')
  findForEnseignant(
    @Query('matieres') matieres: string,
    @Query('promotions') promotions: string,
  ) {
    const mat = matieres ? matieres.split(',') : [];
    const pro = promotions ? promotions.split(',') : [];
    return this.archiveService.findForEnseignant(mat, pro);
  }

  // GET /archives/:id/download — télécharger le fichier
  @Get(':id/download')
  async download(@Param('id') id: string, @Res() res: Response) {
    const archive = this.archiveService.findOne(+id);
    if (!archive.cheminFichier || !existsSync(archive.cheminFichier)) {
      throw new NotFoundException('Fichier introuvable sur le serveur');
    }
    res.sendFile(archive.cheminFichier);
  }

  // GET /archives/:id
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.archiveService.findOne(+id);
  }

  // GET /archives/:id/texte — récupérer le texte pour la génération IA
  @Get(':id/texte')
  getTexte(@Param('id') id: string) {
    return this.archiveService.getTexte(+id);
  }

  // DELETE /archives/:id
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.archiveService.remove(+id);
  }
}
