-- CreateTable
CREATE TABLE "audio_guides" (
    "id" UUID NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audio_guides_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "audio_guides_key_key" ON "audio_guides"("key");
