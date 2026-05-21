import { NotFoundException } from '@nestjs/common';

export class TenantNotFoundException extends NotFoundException {
  constructor(identifier: string) {
    super(`Tenant introuvable : ${identifier}`);
  }
}
