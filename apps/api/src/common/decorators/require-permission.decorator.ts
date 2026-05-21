import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'permission';
export const MODULE_KEY = 'module';

export const RequirePermission = (permission: string) =>
  SetMetadata(PERMISSION_KEY, permission);

export const RequireModule = (module: string) =>
  SetMetadata(MODULE_KEY, module);
