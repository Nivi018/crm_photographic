-- CreateEnum
CREATE TYPE "ArticleType" AS ENUM ('SALE', 'INTERNAL_SUPPLY');

-- CreateEnum
CREATE TYPE "MovementKind" AS ENUM ('ENTRY', 'EXIT', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "AdjustmentMode" AS ENUM ('FINAL_STOCK', 'DELTA');

-- CreateEnum
CREATE TYPE "MovementSource" AS ENUM ('INITIAL_STOCK', 'MANUAL');

-- CreateTable
CREATE TABLE "Category" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Article" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "type" "ArticleType" NOT NULL,
    "categoryId" UUID NOT NULL,
    "initialStock" INTEGER NOT NULL,
    "currentStock" INTEGER NOT NULL,
    "minimumStock" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Movement" (
    "id" UUID NOT NULL,
    "sequence" BIGSERIAL NOT NULL,
    "articleId" UUID NOT NULL,
    "kind" "MovementKind" NOT NULL,
    "adjustmentMode" "AdjustmentMode",
    "source" "MovementSource" NOT NULL,
    "appliedQuantity" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "occurredAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stockBefore" INTEGER NOT NULL,
    "stockAfter" INTEGER NOT NULL,

    CONSTRAINT "Movement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_normalizedName_key" ON "Category"("normalizedName");

-- CreateIndex
CREATE INDEX "Category_isActive_normalizedName_idx" ON "Category"("isActive", "normalizedName");

-- CreateIndex
CREATE UNIQUE INDEX "Article_normalizedName_key" ON "Article"("normalizedName");

-- CreateIndex
CREATE INDEX "Article_categoryId_isActive_idx" ON "Article"("categoryId", "isActive");

-- CreateIndex
CREATE INDEX "Article_isActive_normalizedName_idx" ON "Article"("isActive", "normalizedName");

-- CreateIndex
CREATE UNIQUE INDEX "Movement_sequence_key" ON "Movement"("sequence");

-- CreateIndex
CREATE INDEX "Movement_articleId_occurredAt_sequence_idx" ON "Movement"("articleId", "occurredAt", "sequence");

-- CreateIndex
CREATE INDEX "Movement_occurredAt_sequence_idx" ON "Movement"("occurredAt", "sequence");

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movement" ADD CONSTRAINT "Movement_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
