import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MODULE_KEY } from '../decorators/require-permission.decorator';

@Injectable()
export class ModuleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredModule = this.reflector.getAllAndOverride<string>(MODULE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredModule) return true;

    const request = context.switchToHttp().getRequest<{
      tenant?: { activeModules?: string[] };
    }>();

    const activeModules = request.tenant?.activeModules ?? [];

    if (!activeModules.includes(requiredModule)) {
      throw new ForbiddenException(`Module '${requiredModule}' non activé pour ce tenant`);
    }

    return true;
  }
}
