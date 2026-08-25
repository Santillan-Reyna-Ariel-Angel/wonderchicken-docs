import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { JwtPayload } from '../guards/auth.guard.js';

/**
 * Inyecta el payload del JWT (sub, username, role) en el handler.
 * Lo expone el AuthGuard en `request.user` tras verificar el token.
 *
 * Uso:
 *   @Patch(':id/toggle-active')
 *   toggleActive(@Param('id') id: string, @GetUser() actor: JwtPayload) { ... }
 */
export const GetUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as JwtPayload;
  },
);
