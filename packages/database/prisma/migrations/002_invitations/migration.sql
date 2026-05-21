-- Migration 002 : Table invitations

CREATE TABLE invitations (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email       VARCHAR(255) NOT NULL,
  role_id     UUID         NOT NULL REFERENCES roles(id),
  token       VARCHAR(255) NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ  NOT NULL,
  created_by  UUID         NOT NULL REFERENCES users(id),
  revoked_at  TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invitations_tenant ON invitations(tenant_id, revoked_at, accepted_at);
CREATE INDEX idx_invitations_token  ON invitations(token);
