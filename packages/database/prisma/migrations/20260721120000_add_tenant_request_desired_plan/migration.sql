-- AlterTable
ALTER TABLE "tenant_requests" ADD COLUMN "desired_plan_id" UUID;

-- AddForeignKey
ALTER TABLE "tenant_requests" ADD CONSTRAINT "tenant_requests_desired_plan_id_fkey" FOREIGN KEY ("desired_plan_id") REFERENCES "plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
