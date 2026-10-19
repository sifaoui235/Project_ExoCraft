import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { NotesService } from './notes.service.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@Controller('notes')
@UseGuards(JwtAuthGuard)
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  // GET /notes
  @Get()
  findAll(@CurrentUser() currentUser: { sub: number }) {
    return this.notesService.findAllForUser(currentUser.sub);
  }

  // POST /notes
  @Post()
  create(
    @CurrentUser() currentUser: { sub: number },
    @Body() body: { content: string; tag?: string },
  ) {
    return this.notesService.create(currentUser.sub, body.content, body.tag ?? '');
  }

  // PATCH /notes/:id/pin
  @Patch(':id/pin')
  togglePin(
    @CurrentUser() currentUser: { sub: number },
    @Param('id') id: string,
  ) {
    return this.notesService.togglePin(+id, currentUser.sub);
  }

  // DELETE /notes/:id
  @Delete(':id')
  remove(
    @CurrentUser() currentUser: { sub: number },
    @Param('id') id: string,
  ) {
    return this.notesService.remove(+id, currentUser.sub);
  }
}
