import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { PrismaService } from '../../prisma/prisma.service';

interface JwtUser {
  id: string;
  tenantId: string | null;
  roles: string[];
}

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride<string>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermission) return true;

    const request = context.switchToHttp().getRequest<{ user?: JwtUser }>();
    const user = request.user;
    if (!user) return false;

    // super_admin et restaurant_owner ont toutes les permissions
    if (
      user.roles?.includes('super_admin') ||
      user.roles?.includes('restaurant_owner')
    ) {
      return true;
    }

    const [module, action] = requiredPermission.split('.');
    if (!module || !action) return false;

    const match = await this.prisma.userRole.findFirst({
      where: {
        userId: user.id,
        tenantId: user.tenantId ?? undefined,
        role: {
          rolePermissions: {
            some: { permission: { module, action } },
          },
        },
      },
    });

    return !!match;
  }
}
