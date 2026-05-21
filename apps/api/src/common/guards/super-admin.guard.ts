import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@terangatable/shared';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      user?: { tenantId?: string | null; roles?: string[]; isActive?: boolean };
    }>();

    const user = request.user;

    if (!user || user.tenantId !== null || !user.roles?.includes(UserRole.SUPER_ADMIN)) {
      throw new ForbiddenException('Accès réservé aux super administrateurs');
    }

    return true;
  }
}
