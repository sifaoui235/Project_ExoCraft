import { Controller, Get, Post, Param, Query, Body, Res, HttpCode, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { ExportService } from './export.service.js';
import type { ExportDirectDto } from './export.service.js';

@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  // ─────────────────────────────────────────────────────
  // EXPORT DIRECT depuis texte brut — utilisé après génération IA
  // POST /export/direct/pdf
  // POST /export/direct/word
  // Body : { titre, matiere, theme, type, contenu, avecCorrige }
  // ─────────────────────────────────────────────────────

  @Post('direct/pdf')
  @HttpCode(HttpStatus.OK)
  async exportDirectPdf(@Body() dto: ExportDirectDto, @Res() res: Response) {
    const buffer = await this.exportService.exportDirectPdf(dto);
    const suffix = dto.avecCorrige ? '-corrige' : '-etudiant';
    const nom = `${dto.type}-${dto.theme.slice(0, 30).replace(/\s/g, '-')}${suffix}.pdf`;
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(nom)}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Post('direct/word')
  @HttpCode(HttpStatus.OK)
  async exportDirectWord(@Body() dto: ExportDirectDto, @Res() res: Response) {
    const buffer = await this.exportService.exportDirectWord(dto);
    const suffix = dto.avecCorrige ? '-corrige' : '-etudiant';
    const nom = `${dto.type}-${dto.theme.slice(0, 30).replace(/\s/g, '-')}${suffix}.docx`;
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(nom)}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  // ─────────────────────────────────────────────────────
  // EXPORT depuis contenu sauvegardé (par ID)
  // ─────────────────────────────────────────────────────

  @Get('content/:id/pdf')
  async exportContentPdf(@Param('id') id: string, @Res() res: Response) {
    const buffer = await this.exportService.exportContentPdf(+id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="content-${id}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('content/:id/word')
  async exportContentWord(@Param('id') id: string, @Res() res: Response) {
    const buffer = await this.exportService.exportContentWord(+id);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="content-${id}.docx"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('quiz/:id/pdf')
  async exportQuizPdf(
    @Param('id') id: string,
    @Query('corrige') corrige: string,
    @Res() res: Response,
  ) {
    const avecCorrige = corrige === 'true';
    const buffer = await this.exportService.exportQuizPdf(+id, avecCorrige);
    const suffix = avecCorrige ? '-corrige' : '-etudiant';
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="quiz-${id}${suffix}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('quiz/:id/word')
  async exportQuizWord(
    @Param('id') id: string,
    @Query('corrige') corrige: string,
    @Res() res: Response,
  ) {
    const avecCorrige = corrige === 'true';
    const buffer = await this.exportService.exportQuizWord(+id, avecCorrige);
    const suffix = avecCorrige ? '-corrige' : '-etudiant';
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="quiz-${id}${suffix}.docx"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
