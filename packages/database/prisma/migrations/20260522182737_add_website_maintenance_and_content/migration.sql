-- AlterTable
ALTER TABLE "website_settings" ADD COLUMN     "content_config" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "is_maintenance" BOOLEAN NOT NULL DEFAULT false;
