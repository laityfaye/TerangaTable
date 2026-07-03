-- AlterTable
ALTER TABLE "delivery_agents" ADD COLUMN     "current_lat" DOUBLE PRECISION,
ADD COLUMN     "current_lng" DOUBLE PRECISION,
ADD COLUMN     "location_updated_at" TIMESTAMP(3);
