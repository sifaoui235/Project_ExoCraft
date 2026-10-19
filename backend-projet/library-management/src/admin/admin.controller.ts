import {
  Controller,
  Get,
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

  // GET /admin/users/:id
  @Get('users/:id')
  getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(+id);
  }

  // DELETE /admin/users/:id
  @Delete('users/:id')
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(+id);
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
