import {
  Controller,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { CurrentTenant } from '../../../common/decorators/current-tenant.decorator';
import { OptionsService } from './options.service';
import { UpdateOptionDto } from './dto/update-option.dto';

interface TenantCtx { id: string }

@ApiTags('Menu — Options')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('option-groups/:groupId/options')
export class OptionGroupOptionsController {
  constructor(private readonly optionsService: OptionsService) {}

  @Patch(':optionId')
  @ApiOperation({ summary: 'Modifier une option' })
  updateOption(
    @CurrentTenant() tenant: TenantCtx,
    @Param('groupId') groupId: string,
    @Param('optionId') optionId: string,
    @Body() dto: UpdateOptionDto,
  ) {
    return this.optionsService.updateOption(tenant.id, groupId, optionId, dto);
  }

  @Delete(':optionId')
  @ApiOperation({ summary: 'Supprimer une option' })
  removeOption(
    @CurrentTenant() tenant: TenantCtx,
    @Param('groupId') groupId: string,
    @Param('optionId') optionId: string,
  ) {
    return this.optionsService.removeOption(tenant.id, groupId, optionId);
  }
}
