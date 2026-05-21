import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';

const INVITATION_TTL_HOURS = 48;

@Injectable()
export class InvitationsService {
  private readonly logger = new Logger(InvitationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async findPending(tenantId: string) {
    const invitations = await this.prisma.invitation.findMany({
      where: {
        tenantId,
        revokedAt: null,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { role: true },
      orderBy: { createdAt: 'desc' },
    });

    return invitations.map(this.formatInvitation);
  }

  async create(tenantId: string, dto: CreateInvitationDto, createdBy: string) {
    const role = await this.prisma.role.findFirst({
      where: {
        slug: dto.roleSlug,
        OR: [{ tenantId }, { isSystem: true, tenantId: null }],
      },
    });
    if (!role) throw new NotFoundException(`Rôle "${dto.roleSlug}" introuvable`);

    const existing = await this.prisma.invitation.findFirst({
      where: {
        tenantId,
        email: dto.email,
        revokedAt: null,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    if (existing) {
      throw new ConflictException('Une invitation en attente existe déjà pour cet email');
    }

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + INVITATION_TTL_HOURS * 60 * 60 * 1000);

    const invitation = await this.prisma.invitation.create({
      data: {
        tenantId,
        email: dto.email,
        roleId: role.id,
        token,
        expiresAt,
        createdBy,
      },
      include: { role: true },
    });

    const appUrl = this.config.get<string>('APP_URL', 'http://localhost:3000');
    this.logger.log(`[INVITATION] Lien d'invitation : ${appUrl}/join?token=${token}`);

    return this.formatInvitation(invitation);
  }

  async revoke(tenantId: string, invitationId: string) {
    const invitation = await this.prisma.invitation.findFirst({
      where: { id: invitationId, tenantId },
    });
    if (!invitation) throw new NotFoundException('Invitation introuvable');

    await this.prisma.invitation.update({
      where: { id: invitationId },
      data: { revokedAt: new Date() },
    });

    return { success: true };
  }

  private formatInvitation(invitation: {
    id: string;
    email: string;
    expiresAt: Date;
    createdAt: Date;
    role: { id: string; name: string; slug: string };
  }) {
    return {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
    };
  }
}
