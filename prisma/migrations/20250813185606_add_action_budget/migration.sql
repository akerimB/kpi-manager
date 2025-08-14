-- CreateTable
CREATE TABLE "action_budgets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actionId" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "plannedAmount" REAL NOT NULL DEFAULT 0,
    "actualAmount" REAL NOT NULL DEFAULT 0,
    "capexOpex" TEXT NOT NULL DEFAULT 'OPEX',
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "action_budgets_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "actions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "action_budgets_actionId_key" ON "action_budgets"("actionId");
