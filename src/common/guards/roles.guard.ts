import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import { AuthenticatedRequest } from './auth.guard.js';
import { UserRole } from '../../../generated/prisma/enums.js';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user || !user.role) {
      this.logger.warn('Usuario sin rol en la petición');
      throw new ForbiddenException('Acceso denegado: rol requerido');
    }

    // SUPER_ADMIN tiene acceso global a todos los endpoints (rol de mayor privilegio).
    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      this.logger.warn(
        `Acceso denegado: usuario con rol ${user.role} intentó acceder a endpoint que requiere ${requiredRoles.join(', ')}`,
      );
      throw new ForbiddenException(
        'Acceso denegado: privilegios insuficientes',
      );
    }

    return true;
  }
}
