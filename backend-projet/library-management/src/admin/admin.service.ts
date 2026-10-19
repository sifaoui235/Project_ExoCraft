import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service.js';
import { ContentService } from '../content/content.service.js';
import { QuizService } from '../quiz/quiz.service.js';
import { ArchiveService } from '../archive/archive.service.js';
import { MatiereService } from '../matiere/matiere.service.js';
import { PromotionService } from '../promotion/promotion.service.js';

@Injectable()
export class AdminService {
  constructor(
    private readonly userService: UserService,
    private readonly contentService: ContentService,
    private readonly quizService: QuizService,
    private readonly archiveService: ArchiveService,
    private readonly matiereService: MatiereService,
    private readonly promotionService: PromotionService,
  ) {}

  // ─────────────────────────────────────────────────────
  // TABLEAU DE BORD — statistiques globales
  // ─────────────────────────────────────────────────────

  getDashboard() {
    const users       = this.userService.findAll();
    const enseignants = users.filter((u) => u.role === 'enseignant');
    const admins      = users.filter((u) => u.role === 'administrateur');

    const allContents = this.contentService.findAll({});
    const allQuizzes  = this.quizService.findAll();
    const archives    = this.archiveService.findAll();
    const matieres    = this.matiereService.findAll();
    const promotions  = this.promotionService.findAll();

    // Répartition des contenus par type
    const contentsParType = {
      cours:   allContents.data.filter((c) => c.type === 'cours').length,
      resume:  allContents.data.filter((c) => c.type === 'resume').length,
      serie:   allContents.data.filter((c) => c.type === 'serie').length,
      examen:  allContents.data.filter((c) => c.type === 'examen').length,
    };

    // Répartition par statut
    const contentsParStatut = {
      brouillon: allContents.data.filter((c) => c.statut === 'brouillon').length,
      valide:    allContents.data.filter((c) => c.statut === 'valide').length,
    };

    const quizzesParStatut = {
      brouillon: allQuizzes.filter((q) => q.statut === 'brouillon').length,
      valide:    allQuizzes.filter((q) => q.statut === 'valide').length,
    };

    return {
      utilisateurs: {
        total:       users.length,
        enseignants: enseignants.length,
        admins:      admins.length,
      },
      contenus: {
        total:      allContents.total,
        parType:    contentsParType,
        parStatut:  contentsParStatut,
      },
      quiz: {
        total:      allQuizzes.length,
        parStatut:  quizzesParStatut,
      },
      archives: {
        total: archives.total,
      },
      matieres: {
        total: matieres.length,
      },
      promotions: {
        total: promotions.length,
      },
    };
  }

  // ─────────────────────────────────────────────────────
  // GESTION DES UTILISATEURS
  // ─────────────────────────────────────────────────────

  getAllUsers() {
    return this.userService.findAll();
  }

  getUserById(id: number) {
    return this.userService.findOne(id);
  }

  deleteUser(id: number) {
    return this.userService.remove(id);
  }

  // ─────────────────────────────────────────────────────
  // ASSOCIATION ENSEIGNANT ↔ MATIÈRES / PROMOTIONS
  // (stocké sur le profil utilisateur)
  // ─────────────────────────────────────────────────────

  assignerMatieres(userId: number, matieres: string[]) {
    return this.userService.update(userId, { matieres } as any);
  }

  assignerPromotions(userId: number, promotions: string[]) {
    return this.userService.update(userId, { promotions } as any);
  }
}
