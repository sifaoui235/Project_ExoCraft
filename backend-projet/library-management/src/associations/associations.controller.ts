import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  NotFoundException,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserService } from '../user/user.service.js';

@Controller('associations')
@Roles('administrateur')
export class AssociationsController {
  constructor(private readonly userService: UserService) {}

  // GET /associations — liste enseignants avec leurs matières et promos
  @Get()
  findAll() {
    const users = this.userService.findAll();
    const enseignants = users.filter(
      (u) => u.role === 'enseignant' || u.role === 'admin' || u.role === 'administrateur',
    );

    return enseignants.map((u) => {
      const assocs = u.associations || [];
      return {
        id: u.id,
        nom: u.nom,
        prenom: u.prenom,
        email: u.email,
        matiereNoms: assocs.map((a) => a.className),
        promoNoms: assocs.map((a) => a.section),
      };
    });
  }

  // PUT /associations/:id — mettre à jour les associations d'un user
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() body: { matiereNoms: string[]; promoNoms: string[] },
  ) {
    const user = this.userService.findOne(+id);
    if (!user) throw new NotFoundException(`Utilisateur ${id} introuvable`);

    const matiereNoms = body.matiereNoms || [];
    const promoNoms = body.promoNoms || [];
    const maxLen = Math.max(matiereNoms.length, promoNoms.length);

    const associations = Array.from({ length: maxLen }, (_, i) => ({
      className: matiereNoms[i] ?? '',
      section: promoNoms[i] ?? '',
    }));

    const updated = this.userService.update(+id, { associations } as any);
    if (!updated) throw new NotFoundException(`Utilisateur ${id} introuvable`);

    return {
      id: updated.id,
      nom: updated.nom,
      prenom: updated.prenom,
      email: updated.email,
      matiereNoms: updated.associations.map((a) => a.className),
      promoNoms: updated.associations.map((a) => a.section),
    };
  }
}
