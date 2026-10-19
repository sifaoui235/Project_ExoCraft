import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Patch,
} from '@nestjs/common';
import { AdminService } from './admin.service.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

// Toutes les routes /admin sont réservées à l'administrateur
@Controller('admin')
@Roles('administrateur')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // GET /admin/dashboard
  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboard();
  }

  // GET /admin/users
  @Get('users')
  getAllUsers() {
    return this.adminService.getAllUsers();
  }

  // POST /admin/users — créer un utilisateur
  @Post('users')
  createUser(@Body() body: {
    nom: string;
    prenom: string;
    email: string;
    motDePasse: string;
    role: string;
  }) {
    return this.adminService.createUser(body);
  }

  // GET /admin/users/:id
  @Get('users/:id')
  getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(+id);
  }

  // PUT /admin/users/:id — modifier un utilisateur
  @Put('users/:id')
  updateUser(@Param('id') id: string, @Body() body: any) {
    return this.adminService.updateUser(+id, body);
  }

  // DELETE /admin/users/:id
  @Delete('users/:id')
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(+id);
  }

  // PATCH /admin/users/:id/status — toggle actif/inactif
  @Patch('users/:id/status')
  toggleStatus(@Param('id') id: string) {
    return this.adminService.toggleUserStatus(+id);
  }

  // PATCH /admin/users/:id/promote — promouvoir en admin
  @Patch('users/:id/promote')
  promoteUser(@Param('id') id: string) {
    return this.adminService.promoteUser(+id);
  }

  // PATCH /admin/users/:id/matieres
  @Patch('users/:id/matieres')
  assignerMatieres(
    @Param('id') id: string,
    @Body() body: { matieres: string[] },
  ) {
    return this.adminService.assignerMatieres(+id, body.matieres);
  }

  // PATCH /admin/users/:id/promotions
  @Patch('users/:id/promotions')
  assignerPromotions(
    @Param('id') id: string,
    @Body() body: { promotions: string[] },
  ) {
    return this.adminService.assignerPromotions(+id, body.promotions);
  }
}
