import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
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
  findAll() {
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
}
