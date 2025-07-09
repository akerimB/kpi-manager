-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_simulation_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "simulationId" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "assumedCompletion" REAL NOT NULL,
    "estimatedImpact" REAL,
    "estimatedImpactCategory" TEXT,
    CONSTRAINT "simulation_items_simulationId_fkey" FOREIGN KEY ("simulationId") REFERENCES "simulations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "simulation_items_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "actions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_simulation_items" ("actionId", "assumedCompletion", "estimatedImpact", "estimatedImpactCategory", "id", "simulationId") SELECT "actionId", "assumedCompletion", "estimatedImpact", "estimatedImpactCategory", "id", "simulationId" FROM "simulation_items";
DROP TABLE "simulation_items";
ALTER TABLE "new_simulation_items" RENAME TO "simulation_items";
CREATE UNIQUE INDEX "simulation_items_simulationId_actionId_key" ON "simulation_items"("simulationId", "actionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
