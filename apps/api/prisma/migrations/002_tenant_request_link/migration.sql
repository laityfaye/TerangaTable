-- Add revoked status to TenantRequestStatus enum
ALTER TYPE "TenantRequestStatus" ADD VALUE 'revoked';

-- Add tenant_id column to tenant_requests (nullable, set null on tenant delete)
ALTER TABLE "tenant_requests" ADD COLUMN "tenant_id" TEXT;

-- AddForeignKey
ALTER TABLE "tenant_requests" ADD CONSTRAINT "tenant_requests_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "tenant_requests_tenant_id_idx" ON "tenant_requests"("tenant_id");
