export interface Tokens {
  access_token: string;
  refresh_token: string;
}

export interface AuthResponse extends Tokens {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    tenantId: string | null;
    tenantSlug: string | null;
    roles: string[];
    regionSlug: string | null;
    /** Slugs des modules actifs pour ce tenant (ex: ['menu', 'orders', 'delivery']) */
    activeModules: string[];
  };
}
