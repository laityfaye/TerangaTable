export interface JwtPayload {
  sub: string;
  email: string;
  tenantId: string | null;
  tenant_slug?: string | null;
  roles: string[];
  region_slug?: string | null;
  iat?: number;
  exp?: number;
}
