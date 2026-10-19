import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Injecte l'utilisateur connecté directement dans le paramètre du controller
// Exemple : @CurrentUser() user: { id, email, role }
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
