import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../common/mail/mail.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { AuthResponse, Tokens } from './interfaces/tokens.interface';

const BCRYPT_ROUNDS = 12;

type UserWithRoles = Awaited<ReturnType<AuthService['findUserWithRoles']>>;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
  ) {}

  private findUserWithRoles(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: { include: { role: true } },
        adminOfRegion: { select: { slug: true } },
        tenant: {
          select: {
            slug: true,
            tenantModules: {
              where: { isActive: true },
              include: { module: { select: { slug: true } } },
            },
          },
        },
      },
    });
  }

  private extractRoles(user: NonNullable<UserWithRoles>): string[] {
    if (user.tenantId === null) return ['super_admin'];
    return user.userRoles.map((ur) => ur.role.slug);
  }

  private extractRegionSlug(user: NonNullable<UserWithRoles>): string | null {
    return user.adminOfRegion?.[0]?.slug ?? null;
  }

  private buildPayload(user: NonNullable<UserWithRoles>): JwtPayload {
    return {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      tenant_slug: user.tenant?.slug ?? null,
      roles: this.extractRoles(user),
      region_slug: this.extractRegionSlug(user),
    };
  }

  private async generateTokens(payload: JwtPayload): Promise<Tokens> {
    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>('JWT_SECRET'),
        expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES', '7d'),
      }),
    ]);
    return { access_token, refresh_token };
  }

  private async storeRefreshHash(userId: string, refreshToken: string): Promise<void> {
    const hash = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: hash },
    });
  }

  async login(user: NonNullable<UserWithRoles>): Promise<AuthResponse> {
    const payload = this.buildPayload(user);
    const tokens = await this.generateTokens(payload);

    await Promise.all([
      this.storeRefreshHash(user.id, tokens.refresh_token),
      this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      }),
    ]);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        tenantId: user.tenantId,
        tenantSlug: user.tenant?.slug ?? null,
        roles: payload.roles,
        regionSlug: this.extractRegionSlug(user),
        activeModules: user.tenant?.tenantModules?.map((tm) => tm.module.slug) ?? [],
      },
    };
  }

  async refresh(userId: string): Promise<Tokens> {
    const user = await this.findUserWithRoles(userId);
    if (!user?.isActive) throw new UnauthorizedException('Compte inactif');

    const payload = this.buildPayload(user);
    const tokens = await this.generateTokens(payload);
    await this.storeRefreshHash(user.id, tokens.refresh_token);
    return tokens;
  }

  async logout(userId: string): Promise<{ success: true }> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
    return { success: true };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: { rolePermissions: { include: { permission: true } } },
            },
          },
        },
      },
    });

    if (!user) throw new UnauthorizedException('Utilisateur introuvable');

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      tenantId: user.tenantId,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      roles: user.userRoles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
        slug: ur.role.slug,
        permissions: ur.role.rolePermissions.map((rp) => ({
          module: rp.permission.module,
          action: rp.permission.action,
          resource: rp.permission.resource,
        })),
      })),
    };
  }

  async forgotPassword(email: string): Promise<{ success: true }> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (user) {
      const token = randomUUID();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: token,
          passwordResetExpiresAt: expiresAt,
        },
      });

      const appUrl = this.config.get<string>('APP_URL', 'http://localhost:3000');
      const resetUrl = `${appUrl}/reset-password?token=${token}`;
      this.logger.log(`[AUTH] Reset link: ${resetUrl}`);
      await this.mail.sendPasswordReset(user.email, resetUrl);
    }

    return { success: true };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ success: true }> {
    const user = await this.prisma.user.findFirst({
      where: { passwordResetToken: token },
    });

    if (
      !user ||
      !user.passwordResetExpiresAt ||
      user.passwordResetExpiresAt < new Date()
    ) {
      throw new BadRequestException('Token invalide ou expiré');
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
        refreshTokenHash: null,
      },
    });

    return { success: true };
  }
}
