import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AiService } from './ai.service.js';
import { GenerateContentDto } from './dto/generate-content.dto.js';
import { SaveGeneratedDto } from './dto/save-generated.dto.js';
import { ChatDto } from './dto/chat.dto.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  // ─────────────────────────────────────────────────────
  // POST /ai/chat
  // Conversation libre avec l'IA
  // ─────────────────────────────────────────────────────
  @Post('chat')
  @HttpCode(HttpStatus.OK)
  chat(@Body() dto: ChatDto) {
    return this.aiService.chat(dto);
  }

  // ─────────────────────────────────────────────────────
  // POST /ai/generate-from-archive/:archiveId (BF-19)
  // Génère du contenu depuis le texte d'une archive
  // ─────────────────────────────────────────────────────
  @Post('generate-from-archive/:archiveId')
  @HttpCode(HttpStatus.OK)
  generateFromArchive(
    @Param('archiveId') archiveId: string,
    @Body() dto: GenerateContentDto,
  ) {
    return this.aiService.generateFromArchive(+archiveId, dto);
  }

  // ─────────────────────────────────────────────────────
  // POST /ai/generate
  // L'enseignant envoie : matière, type, thème, cours (optionnel)
  // L'IA retourne le contenu généré (pas encore sauvegardé)
  // ─────────────────────────────────────────────────────
  @Post('generate')
  @HttpCode(HttpStatus.OK)
  generate(@Body() dto: GenerateContentDto) {
    return this.aiService.generate(dto);
  }

  // ─────────────────────────────────────────────────────
  // POST /ai/save
  // Sauvegarde le contenu généré :
  //  - cours/resume  → ContentService (visible dans "Mes Contenus")
  //  - quiz/serie/examen → QuizService (visible dans "Mes Quiz")
  // ─────────────────────────────────────────────────────
  @Post('save')
  @HttpCode(HttpStatus.CREATED)
  save(
    @Body() dto: SaveGeneratedDto,
    @CurrentUser() user: { id: number },
  ) {
    return this.aiService.save(dto, user?.id);
  }

  // ─────────────────────────────────────────────────────
  // GET /ai/contents
  // Lister tous les contenus générés
  // ─────────────────────────────────────────────────────
  @Get('contents')
  findAll() {
    return this.aiService.findAll();
  }

  // ─────────────────────────────────────────────────────
  // GET /ai/contents/:id
  // Voir un contenu généré
  // ─────────────────────────────────────────────────────
  @Get('contents/:id')
  findOne(@Param('id') id: string) {
    return this.aiService.findOne(+id);
  }

  // ─────────────────────────────────────────────────────
  // PATCH /ai/contents/:id/valider
  // Valider un contenu (brouillon → validé)
  // ─────────────────────────────────────────────────────
  @Patch('contents/:id/valider')
  valider(@Param('id') id: string) {
    return this.aiService.valider(+id);
  }

  // ─────────────────────────────────────────────────────
  // PATCH /ai/contents/:id/modifier
  // Modifier manuellement le contenu généré
  // ─────────────────────────────────────────────────────
  @Patch('contents/:id/modifier')
  modifier(
    @Param('id') id: string,
    @Body() body: { contenu: string },
  ) {
    return this.aiService.updateContenu(+id, body.contenu);
  }
}
