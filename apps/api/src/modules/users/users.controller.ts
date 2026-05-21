import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import type { TenantContext } from '../../common/interceptors/tenant-context.interceptor';

interface JwtUser {
  id: string;
  email: string;
  tenantId: string | null;
  roles: string[];
  isActive: boolean;
}

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Roles('manager', 'super_admin')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les membres de l\'équipe du restaurant' })
  @ApiResponse({ status: 200, description: 'Liste des utilisateurs du tenant' })
  findAll(@CurrentTenant() tenant: TenantContext) {
    return this.usersService.findAll(tenant.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un nouveau membre de l\'équipe' })
  @ApiResponse({ status: 201, description: 'Utilisateur créé avec succès' })
  @ApiResponse({ status: 409, description: 'Email déjà utilisé' })
  create(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtUser,
    @Body() dto: CreateUserDto,
  ) {
    return this.usersService.create(tenant.id, dto, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un membre de l\'équipe' })
  @ApiResponse({ status: 200, description: 'Utilisateur mis à jour' })
  update(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(tenant.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Désactiver un membre de l\'équipe' })
  @ApiResponse({ status: 200, description: '{ success: true }' })
  deactivate(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
  ) {
    return this.usersService.deactivate(tenant.id, id, user.id);
  }
}
