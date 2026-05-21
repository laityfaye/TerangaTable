import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@terangatable/shared';

@Injectable()
export class RegionalAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      user?: {
        tenantId?: string | null;
        roles?: string[];
        isActive?: boolean;
        settings?: { region_id?: string };
      };
      params?: { regionId?: string };
      body?: { region_id?: string };
    }>();

    const user = request.user;

    if (!user || user.tenantId !== null || !user.roles?.includes(UserRole.REGIONAL_ADMIN)) {
      throw new ForbiddenException('Accès réservé aux administrateurs régionaux');
    }

    const adminRegionId = user.settings?.region_id;
    const requestedRegionId = request.params?.regionId ?? request.body?.region_id;

    if (requestedRegionId && requestedRegionId !== adminRegionId) {
      throw new ForbiddenException('Accès limité à votre région');
    }

    return true;
  }
}
