-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_action_steps" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "actionId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "period" TEXT,
    "plannedCost" REAL DEFAULT 0,
    "actualCost" REAL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "capexOpex" TEXT NOT NULL DEFAULT 'OPEX',
    CONSTRAINT "action_steps_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "actions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_action_steps" ("actionId", "createdAt", "description", "dueDate", "id", "status", "title", "updatedAt") SELECT "actionId", "createdAt", "description", "dueDate", "id", "status", "title", "updatedAt" FROM "action_steps";
DROP TABLE "action_steps";
ALTER TABLE "new_action_steps" RENAME TO "action_steps";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
