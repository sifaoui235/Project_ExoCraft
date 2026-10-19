import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

// Exemple : @Roles('administrateur') ou @Roles('enseignant', 'administrateur')
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
