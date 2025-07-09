/*
  Warnings:

  - Added the required column `updatedAt` to the `simulation_items` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_kpi_values" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "value" REAL NOT NULL,
    "period" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "quarter" INTEGER,
    "month" INTEGER,
    "kpiId" TEXT NOT NULL,
    "factoryId" TEXT NOT NULL,
    "enteredBy" TEXT,
    "enteredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "kpi_values_kpiId_fkey" FOREIGN KEY ("kpiId") REFERENCES "kpis" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "kpi_values_factoryId_fkey" FOREIGN KEY ("factoryId") REFERENCES "model_factories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "kpi_values_enteredBy_fkey" FOREIGN KEY ("enteredBy") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_kpi_values" ("enteredAt", "enteredBy", "factoryId", "id", "kpiId", "month", "period", "quarter", "updatedAt", "value", "year") SELECT "enteredAt", "enteredBy", "factoryId", "id", "kpiId", "month", "period", "quarter", "updatedAt", "value", "year" FROM "kpi_values";
DROP TABLE "kpi_values";
ALTER TABLE "new_kpi_values" RENAME TO "kpi_values";
CREATE UNIQUE INDEX "kpi_values_kpiId_factoryId_period_key" ON "kpi_values"("kpiId", "factoryId", "period");
CREATE TABLE "new_simulation_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "simulationId" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "assumedCompletion" REAL NOT NULL DEFAULT 50,
    "estimatedImpact" REAL DEFAULT 0,
    "estimatedImpactCategory" TEXT DEFAULT 'MEDIUM',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "simulation_items_simulationId_fkey" FOREIGN KEY ("simulationId") REFERENCES "simulations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "simulation_items_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "actions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_simulation_items" ("actionId", "assumedCompletion", "estimatedImpact", "estimatedImpactCategory", "id", "simulationId") SELECT "actionId", "assumedCompletion", "estimatedImpact", "estimatedImpactCategory", "id", "simulationId" FROM "simulation_items";
DROP TABLE "simulation_items";
ALTER TABLE "new_simulation_items" RENAME TO "simulation_items";
CREATE UNIQUE INDEX "simulation_items_simulationId_actionId_key" ON "simulation_items"("simulationId", "actionId");
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "hashedPassword" TEXT,
    "role" TEXT NOT NULL DEFAULT 'MODEL_FACTORY',
    "factoryId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" DATETIME,
    "permissions" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "users_factoryId_fkey" FOREIGN KEY ("factoryId") REFERENCES "model_factories" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_users" ("createdAt", "email", "factoryId", "hashedPassword", "id", "name", "role", "updatedAt") SELECT "createdAt", "email", "factoryId", "hashedPassword", "id", "name", "role", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
