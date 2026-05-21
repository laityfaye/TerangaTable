import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCustomFieldDto } from './dto/create-custom-field.dto';
import { UpdateCustomFieldDto } from './dto/update-custom-field.dto';
import { ListCustomFieldsDto } from './dto/list-custom-fields.dto';
import { UpsertCustomFieldValueDto } from './dto/upsert-custom-field-value.dto';
import { ReorderCustomFieldsDto } from './dto/reorder-custom-fields.dto';

@Injectable()
export class CustomFieldsService {
  constructor(private readonly prisma: PrismaService) {}

  private toSnakeCase(str: string): string {
    return str
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  async findAll(tenantId: string, dto: ListCustomFieldsDto) {
    return this.prisma.customField.findMany({
      where: {
        tenantId,
        ...(dto.entity_type && { entityType: dto.entity_type }),
      },
      orderBy: [{ entityType: 'asc' }, { sortOrder: 'asc' }],
    });
  }

  async create(tenantId: string, dto: CreateCustomFieldDto) {
    const name = dto.name ?? this.toSnakeCase(dto.label);

    const existing = await this.prisma.customField.findFirst({
      where: { tenantId, entityType: dto.entity_type, name },
    });
    if (existing) {
      throw new BadRequestException(
        `Un champ avec le nom "${name}" existe déjà pour ce type d'entité`,
      );
    }

    return this.prisma.customField.create({
      data: {
        tenantId,
        entityType: dto.entity_type,
        name,
        label: dto.label,
        fieldType: dto.field_type as never,
        options: dto.options ?? undefined,
        isRequired: dto.is_required ?? false,
        isShownOnVitrine: dto.is_shown_on_vitrine ?? false,
        sortOrder: dto.sort_order ?? 0,
      },
    });
  }

  async findOne(tenantId: string, id: string) {
    const field = await this.prisma.customField.findFirst({
      where: { id, tenantId },
    });
    if (!field) throw new NotFoundException('Champ introuvable');
    return field;
  }

  async update(tenantId: string, id: string, dto: UpdateCustomFieldDto) {
    await this.findOne(tenantId, id);
    return this.prisma.customField.update({
      where: { id },
      data: {
        ...(dto.label !== undefined && { label: dto.label }),
        ...(dto.field_type !== undefined && { fieldType: dto.field_type as never }),
        ...(dto.options !== undefined && { options: dto.options }),
        ...(dto.is_required !== undefined && { isRequired: dto.is_required }),
        ...(dto.is_shown_on_vitrine !== undefined && { isShownOnVitrine: dto.is_shown_on_vitrine }),
        ...(dto.sort_order !== undefined && { sortOrder: dto.sort_order }),
      },
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    await this.prisma.customFieldValue.deleteMany({ where: { customFieldId: id } });
    return this.prisma.customField.delete({ where: { id } });
  }

  async reorder(tenantId: string, dto: ReorderCustomFieldsDto) {
    await Promise.all(
      dto.items.map((item) =>
        this.prisma.customField.updateMany({
          where: { id: item.id, tenantId },
          data: { sortOrder: item.sort_order },
        }),
      ),
    );
    return { success: true };
  }

  async upsertValue(tenantId: string, dto: UpsertCustomFieldValueDto) {
    const field = await this.prisma.customField.findFirst({
      where: { id: dto.custom_field_id, tenantId },
    });
    if (!field) throw new NotFoundException('Champ introuvable');

    const valueData: {
      valueString?: string | null;
      valueNumber?: number | null;
      valueBoolean?: boolean | null;
      valueDate?: Date | null;
    } = {
      valueString: null,
      valueNumber: null,
      valueBoolean: null,
      valueDate: null,
    };

    if (dto.value !== null && dto.value !== undefined) {
      switch (field.fieldType) {
        case 'string':
        case 'text':
        case 'select':
          valueData.valueString = String(dto.value);
          break;
        case 'number':
          valueData.valueNumber = Number(dto.value);
          break;
        case 'boolean':
          valueData.valueBoolean = Boolean(dto.value);
          break;
        case 'date':
          valueData.valueDate = new Date(String(dto.value));
          break;
      }
    }

    return this.prisma.customFieldValue.upsert({
      where: {
        customFieldId_entityId: {
          customFieldId: dto.custom_field_id,
          entityId: dto.entity_id,
        },
      },
      create: {
        tenantId,
        customFieldId: dto.custom_field_id,
        entityId: dto.entity_id,
        entityType: dto.entity_type,
        ...valueData,
      },
      update: valueData,
    });
  }

  async getValues(tenantId: string, entityType: string, entityId: string) {
    const values = await this.prisma.customFieldValue.findMany({
      where: { tenantId, entityType, entityId },
      include: { customField: true },
    });

    return values.map((v) => this.formatValue(v));
  }

  async getValuesFormatted(tenantId: string, entityType: string, entityId: string) {
    const [fields, values] = await Promise.all([
      this.prisma.customField.findMany({
        where: { tenantId, entityType },
        orderBy: [{ sortOrder: 'asc' }],
      }),
      this.prisma.customFieldValue.findMany({
        where: { tenantId, entityType, entityId },
        include: { customField: true },
      }),
    ]);

    const valueMap = new Map(values.map((v) => [v.customFieldId, v]));

    return fields.map((field) => {
      const v = valueMap.get(field.id);
      return {
        id: field.id,
        name: field.name,
        label: field.label,
        type: field.fieldType,
        options: field.options,
        is_required: field.isRequired,
        is_shown_on_vitrine: field.isShownOnVitrine,
        value: v ? this.extractRawValue(v) : null,
      };
    });
  }

  private formatValue(v: { id: string; customFieldId: string; customField: { label: string; fieldType: string; isRequired: boolean; isShownOnVitrine: boolean; options: unknown }; valueString: string | null; valueNumber: unknown; valueBoolean: boolean | null; valueDate: Date | null }) {
    return {
      id: v.id,
      custom_field_id: v.customFieldId,
      label: v.customField.label,
      type: v.customField.fieldType,
      options: v.customField.options,
      is_required: v.customField.isRequired,
      is_shown_on_vitrine: v.customField.isShownOnVitrine,
      value: this.extractRawValue(v),
    };
  }

  private extractRawValue(v: { customField: { fieldType: string }; valueString: string | null; valueNumber: unknown; valueBoolean: boolean | null; valueDate: Date | null }): string | number | boolean | null {
    switch (v.customField.fieldType) {
      case 'string':
      case 'text':
      case 'select':
        return v.valueString ?? null;
      case 'number':
        return v.valueNumber != null ? Number(v.valueNumber) : null;
      case 'boolean':
        return v.valueBoolean ?? null;
      case 'date':
        return v.valueDate ? (v.valueDate as Date).toISOString().slice(0, 10) : null;
      default:
        return v.valueString ?? null;
    }
  }
}
