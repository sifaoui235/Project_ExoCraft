import { Module } from '@nestjs/common';
import { MatiereService } from './matiere.service.js';
import { MatiereController } from './matiere.controller.js';

@Module({
  controllers: [MatiereController],
  providers: [MatiereService],
  exports: [MatiereService],
})
export class MatiereModule {}
