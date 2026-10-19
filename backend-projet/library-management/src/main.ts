import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard.js';
import { RolesGuard } from './auth/guards/roles.guard.js';

async function bootstrap() {
  const app: any = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:4173',
    ],
    credentials: true,
  });

  // ── Préfixe global /api ────────────────────────────
  app.setGlobalPrefix('api');

  // ── Validation globale des DTOs ─────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,      // supprime les champs non déclarés dans le DTO
      forbidNonWhitelisted: false, // on accepte les champs supplémentaires (compatibilité frontend)
      transform: true,      // convertit les types automatiquement (string → number)
    }),
  );

  // ── Guards globaux ──────────────────────────────────
  // Toutes les routes sont protégées par JWT sauf celles marquées @Public()
  const reflector = app.get(Reflector);
  app.useGlobalGuards(
    new JwtAuthGuard(reflector),
    new RolesGuard(reflector),
  );

  // ── Swagger ─────────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('ExoCraft API')
    .setDescription('API du backend ExoCraft')
    .setVersion('1.0')
    .addBearerAuth()   // bouton Authorize dans Swagger
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
