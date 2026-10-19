import { Controller, Get } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserService } from '../user/user.service.js';
import { MatiereService } from '../matiere/matiere.service.js';
import { PromotionService } from '../promotion/promotion.service.js';
import { ArchiveService } from '../archive/archive.service.js';

@Controller('stats')
@Roles('administrateur')
export class StatsController {
  constructor(
    private readonly userService: UserService,
    private readonly matiereService: MatiereService,
    private readonly promotionService: PromotionService,
    private readonly archiveService: ArchiveService,
  ) {}

  // GET /stats — statistiques globales pour le dashboard admin
  @Get()
  getStats() {
    const users = this.userService.findAll();
    const admins = users.filter((u) => u.role === 'admin' || u.role === 'administrateur').length;
    const enseignants = users.filter((u) => u.role === 'enseignant').length;
    const actifs = users.filter((u) => u.actif !== false).length;

    const matieres = this.matiereService.findAll();
    const promotions = this.promotionService.findAll();
    const archives = this.archiveService.findAll();

    return {
      users: {
        total: users.length,
        admins,
        enseignants,
        actifs,
      },
      matieres: {
        total: matieres.length,
      },
      promotions: {
        total: promotions.length,
      },
      archives: {
        total: archives.total,
      },
      generations: {
        total: 0,
      },
    };
  }
}
