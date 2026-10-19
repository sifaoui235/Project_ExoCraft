import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { UserModule } from './user/user.module.js';
import { QuizModule } from './quiz/quiz.module.js';
import { AuthModule } from './auth/auth.module.js';
import { MatiereModule } from './matiere/matiere.module.js';
import { PromotionModule } from './promotion/promotion.module.js';
import { AiModule } from './ai/ai.module.js';
import { ContentModule } from './content/content.module.js';
import { ArchiveModule } from './archive/archive.module.js';
import { ExportModule } from './export/export.module.js';
import { AdminModule } from './admin/admin.module.js';
import { StatsModule } from './stats/stats.module.js';
import { AssociationsModule } from './associations/associations.module.js';
import { ProfileModule } from './profile/profile.module.js';
import { NotesModule } from './notes/notes.module.js';
import { GenerationsModule } from './generations/generations.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    UserModule,
    QuizModule,
    AuthModule,
    MatiereModule,
    PromotionModule,
    AiModule,
    ContentModule,
    ArchiveModule,
    ExportModule,
    AdminModule,
    StatsModule,
    AssociationsModule,
    ProfileModule,
    NotesModule,
    GenerationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
