import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string) {
    const [systemRoles, tenantRoles] = await Promise.all([
      this.prisma.role.findMany({
        where: { isSystem: true, tenantId: null },
        include: { rolePermissions: { include: { permission: true } } },
        orderBy: { name: 'asc' },
      }),
      this.prisma.role.findMany({
        where: { tenantId },
        include: { rolePermissions: { include: { permission: true } } },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    return [...systemRoles, ...tenantRoles].map(this.formatRole);
  }

  async findAllPermissions() {
    return this.prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { action: 'asc' }],
    });
  }

  async create(tenantId: string, dto: CreateRoleDto) {
    const existing = await this.prisma.role.findFirst({
      where: { tenantId, slug: dto.slug },
    });
    if (existing) throw new ConflictException(`Un rôle avec le slug "${dto.slug}" existe déjà`);

    const role = await this.prisma.role.create({
      data: {
        tenantId,
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        isSystem: false,
      },
      include: { rolePermissions: { include: { permission: true } } },
    });

    return this.formatRole(role);
  }

  async setPermissions(tenantId: string, roleId: string, permissionIds: string[]) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundException('Rôle introuvable');

    if (role.isSystem && role.tenantId === null) {
      throw new ForbiddenException('Les rôles système ne peuvent pas être modifiés');
    }

    if (role.tenantId !== null && role.tenantId !== tenantId) {
      throw new ForbiddenException('Ce rôle n\'appartient pas à votre restaurant');
    }

    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { roleId } }),
      ...permissionIds.map((permissionId) =>
        this.prisma.rolePermission.create({ data: { roleId, permissionId } }),
      ),
    ]);

    const updated = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: { rolePermissions: { include: { permission: true } } },
    });

    return this.formatRole(updated!);
  }

  async delete(tenantId: string, roleId: string) {
    const role = await this.prisma.role.findFirst({
      where: { id: roleId, tenantId },
    });
    if (!role) throw new NotFoundException('Rôle introuvable');
    if (role.isSystem) throw new ForbiddenException('Les rôles système ne peuvent pas être supprimés');

    const usersWithRole = await this.prisma.userRole.count({ where: { roleId, tenantId } });
    if (usersWithRole > 0) {
      throw new ConflictException(`Ce rôle est attribué à ${usersWithRole} membre(s). Réaffectez-les avant de supprimer.`);
    }

    await this.prisma.role.delete({ where: { id: roleId } });
    return { success: true };
  }

  private formatRole(role: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    isSystem: boolean;
    tenantId: string | null;
    createdAt: Date;
    rolePermissions: { permission: { id: string; module: string; action: string; resource: string; description: string | null } }[];
  }) {
    return {
      id: role.id,
      name: role.name,
      slug: role.slug,
      description: role.description,
      isSystem: role.isSystem,
      tenantId: role.tenantId,
      createdAt: role.createdAt,
      permissions: role.rolePermissions.map((rp) => ({
        id: rp.permission.id,
        module: rp.permission.module,
        action: rp.permission.action,
        resource: rp.permission.resource,
        description: rp.permission.description,
        key: `${rp.permission.module}.${rp.permission.action}`,
      })),
    };
  }
}
