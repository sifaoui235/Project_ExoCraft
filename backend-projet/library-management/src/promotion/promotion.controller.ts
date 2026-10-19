import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { PromotionService } from './promotion.service.js';
import { CreatePromotionDto } from './dto/create-promotion.dto.js';
import { UpdatePromotionDto } from './dto/update-promotion.dto.js';

@Controller('promotions')
export class PromotionController {
  constructor(private readonly promotionService: PromotionService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreatePromotionDto) {
    return this.promotionService.create(dto);
  }

  @Get()
  findAll() {
    return this.promotionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.promotionService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePromotionDto) {
    return this.promotionService.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.promotionService.remove(+id);
  }
}
