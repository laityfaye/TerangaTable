import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { TenantStatus } from '@terangatable/shared';

export class TrialExpiredException extends ForbiddenException {
  constructor() {
    super("Période d'essai expirée");
  }
}

export class AccountSuspendedException extends ForbiddenException {
  constructor() {
    super('Compte suspendu');
  }
}

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      tenant?: { id: string; status: string; trialEndsAt?: string | null };
      user?: { tenantId?: string | null; isActive?: boolean };
    }>();

    const tenant = request.tenant;
    const user = request.user;

    if (!tenant) {
      throw new UnauthorizedException('Tenant non identifié');
    }

    if (tenant.status === TenantStatus.SUSPENDED) {
      throw new AccountSuspendedException();
    }

    if (tenant.status === TenantStatus.DELETED) {
      throw new NotFoundException('Tenant introuvable');
    }

    if (
      tenant.status === TenantStatus.TRIAL &&
      tenant.trialEndsAt &&
      new Date(tenant.trialEndsAt) < new Date()
    ) {
      throw new TrialExpiredException();
    }

    if (user && user.tenantId !== tenant.id) {
      throw new ForbiddenException('Accès non autorisé à ce tenant');
    }

    return true;
  }
}
