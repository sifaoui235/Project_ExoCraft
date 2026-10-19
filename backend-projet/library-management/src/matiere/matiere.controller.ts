import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync } from 'fs';
import type { Response } from 'express';
import { MatiereService } from './matiere.service.js';
import { CreateMatiereDto } from './dto/create-matiere.dto.js';
import { UpdateMatiereDto } from './dto/update-matiere.dto.js';

@Controller('matieres')
export class MatiereController {
  constructor(private readonly matiereService: MatiereService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createMatiereDto: CreateMatiereDto) {
    return this.matiereService.create(createMatiereDto);
  }

  @Get()
  findAll(@Query('promoId') _promoId?: string, @Query('search') _search?: string) {
    return this.matiereService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.matiereService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMatiereDto: UpdateMatiereDto) {
    return this.matiereService.update(+id, updateMatiereDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.matiereService.remove(+id);
  }

  // ── Documents ───────────────────────────────────────────────────────────
  // POST /matieres/:id/documents
  @Post(':id/documents')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads', 'matieres'),
        filename: (_req, file, cb) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, unique + extname(file.originalname));
        },
      }),
      limits: { fileSize: 20 * 1024 * 1024 },
    }),
  )
  uploadDocument(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { titre: string; type: string; format: string; promo: string },
  ) {
    if (!file) throw new BadRequestException('Aucun fichier fourni');
    return this.matiereService.addDocument(+id, {
      titre: body.titre,
      type: body.type,
      format: body.format,
      fileName: file.originalname,
      size: `${(file.size / 1024).toFixed(0)} Ko`,
      promo: body.promo,
      filePath: file.path,
    });
  }

  // PUT /matieres/:id/documents/:docId
  @Patch(':id/documents/:docId')
  updateDocument(
    @Param('id') id: string,
    @Param('docId') docId: string,
    @Body() body: any,
  ) {
    return this.matiereService.updateDocument(+id, +docId, body);
  }

  // DELETE /matieres/:id/documents/:docId
  @Delete(':id/documents/:docId')
  removeDocument(@Param('id') id: string, @Param('docId') docId: string) {
    this.matiereService.deleteDocument(+id, +docId);
    return { message: 'Document supprimé' };
  }

  // GET /matieres/:id/documents/:docId/download
  @Get(':id/documents/:docId/download')
  downloadDocument(
    @Param('id') id: string,
    @Param('docId') docId: string,
    @Res() res: Response,
  ) {
    const matiere = this.matiereService.findOne(+id);
    const doc = matiere.documents.find((d) => d.id === +docId);
    if (!doc) throw new NotFoundException('Document introuvable');
    if (!doc.filePath || !existsSync(doc.filePath)) {
      throw new NotFoundException('Fichier introuvable sur le serveur');
    }
    res.sendFile(doc.filePath);
  }
}
