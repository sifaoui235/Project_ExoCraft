import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard.js';
import { RolesGuard } from './auth/guards/roles.guard.js';
import { AuthService } from './auth/auth.service.js';
import { Persist } from './db/persist.js';

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

  // ── Seed admin par défaut ────────────────────────────
  // Crée le compte admin au démarrage s'il n'existe pas encore
  const authService = app.get(AuthService);
  try {
    await authService.register({
      nom: 'Admin',
      prenom: 'Système',
      email: 'admin@tekup.tn',
      motDePasse: 'admin@1234',
      role: 'admin',
    } as any);
    console.log('✅ Compte admin créé : admin@tekup.tn / admin@1234');
  } catch {
    // Déjà existant — pas d'action nécessaire
    console.log('ℹ️  Compte admin déjà existant.');
  }

  // ── Charger les données persistées ─────────────────────
  Persist.loadAll();

  // ── Sauvegarder les données à l'arrêt du serveur ────────
  process.on('SIGINT', () => { Persist.saveAll(); process.exit(0); });
  process.on('SIGTERM', () => { Persist.saveAll(); process.exit(0); });

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
