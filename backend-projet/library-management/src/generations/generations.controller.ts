import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { GenerationsService } from './generations.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@Controller('generations')
@UseGuards(JwtAuthGuard)
export class GenerationsController {
  constructor(private readonly generationsService: GenerationsService) {}

  // GET /generations/stats
  @Get('stats')
  getStats() {
    return this.generationsService.getStats();
  }

  // GET /generations?page=1&limit=20
  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.generationsService.findAll(
      page ? +page : 1,
      limit ? +limit : 20,
    );
  }
}
