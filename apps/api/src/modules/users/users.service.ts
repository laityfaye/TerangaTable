import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string) {
    const users = await this.prisma.user.findMany({
      where: { tenantId },
      include: { userRoles: { include: { role: true } } },
      orderBy: { createdAt: 'asc' },
    });

    return users.map((u) => this.formatUser(u));
  }

  async create(tenantId: string, dto: CreateUserDto, grantedBy: string) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Cet email est déjà utilisé');

    const role = await this.prisma.role.findFirst({ where: { slug: dto.role, isSystem: true } });
    if (!role) throw new NotFoundException(`Rôle "${dto.role}" introuvable`);

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        tenantId,
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        passwordHash,
        userRoles: {
          create: {
            roleId: role.id,
            tenantId,
            grantedBy,
          },
        },
      },
      include: { userRoles: { include: { role: true } } },
    });

    return this.formatUser(user);
  }

  async update(tenantId: string, userId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, tenantId } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    const updateData: Record<string, unknown> = {};
    if (dto.firstName !== undefined) updateData.firstName = dto.firstName;
    if (dto.lastName !== undefined) updateData.lastName = dto.lastName;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    await this.prisma.user.update({ where: { id: userId }, data: updateData });

    if (dto.role) {
      const role = await this.prisma.role.findFirst({ where: { slug: dto.role, isSystem: true } });
      if (!role) throw new NotFoundException(`Rôle "${dto.role}" introuvable`);

      await this.prisma.userRole.deleteMany({ where: { userId, tenantId } });
      await this.prisma.userRole.create({ data: { userId, roleId: role.id, tenantId } });
    }

    const updated = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { userRoles: { include: { role: true } } },
    });

    return this.formatUser(updated!);
  }

  async deactivate(tenantId: string, userId: string, requesterId: string) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, tenantId } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    if (userId === requesterId) throw new ForbiddenException('Vous ne pouvez pas désactiver votre propre compte');

    await this.prisma.user.update({ where: { id: userId }, data: { isActive: false } });
    return { success: true };
  }

  private formatUser(user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    avatarUrl: string | null;
    isActive: boolean;
    lastLoginAt: Date | null;
    createdAt: Date;
    userRoles: { role: { id: string; name: string; slug: string } }[];
  }) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      role: user.userRoles[0]?.role ?? null,
    };
  }
}
