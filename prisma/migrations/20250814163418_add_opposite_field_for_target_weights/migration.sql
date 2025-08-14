-- CreateTable
CREATE TABLE "factory_sector_weights" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "factoryId" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "share" REAL NOT NULL,
    CONSTRAINT "factory_sector_weights_factoryId_fkey" FOREIGN KEY ("factoryId") REFERENCES "model_factories" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "factory_target_weights" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "factoryId" TEXT NOT NULL,
    "strategicTargetId" TEXT NOT NULL,
    "weight" REAL NOT NULL,
    CONSTRAINT "factory_target_weights_factoryId_fkey" FOREIGN KEY ("factoryId") REFERENCES "model_factories" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "factory_target_weights_strategicTargetId_fkey" FOREIGN KEY ("strategicTargetId") REFERENCES "strategic_targets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "factory_sector_weights_factoryId_sector_key" ON "factory_sector_weights"("factoryId", "sector");

-- CreateIndex
CREATE UNIQUE INDEX "factory_target_weights_factoryId_strategicTargetId_key" ON "factory_target_weights"("factoryId", "strategicTargetId");
