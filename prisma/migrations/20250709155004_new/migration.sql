-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "hashedPassword" TEXT,
    "role" TEXT NOT NULL DEFAULT 'MODEL_FACTORY',
    "factoryId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "users_factoryId_fkey" FOREIGN KEY ("factoryId") REFERENCES "model_factories" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "model_factories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "region" TEXT,
    "established" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "strategic_goals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "strategic_targets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "strategicGoalId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "strategic_targets_strategicGoalId_fkey" FOREIGN KEY ("strategicGoalId") REFERENCES "strategic_goals" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "kpis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "unit" TEXT,
    "targetValue" REAL,
    "themes" TEXT NOT NULL,
    "strategicTargetId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "kpis_strategicTargetId_fkey" FOREIGN KEY ("strategicTargetId") REFERENCES "strategic_targets" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "kpi_values" (
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
    CONSTRAINT "kpi_values_factoryId_fkey" FOREIGN KEY ("factoryId") REFERENCES "model_factories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "phases" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "actions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "completionPercent" REAL NOT NULL DEFAULT 0,
    "phaseId" TEXT,
    "strategicTargetId" TEXT NOT NULL,
    "responsibleUnit" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "actions_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "phases" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "actions_strategicTargetId_fkey" FOREIGN KEY ("strategicTargetId") REFERENCES "strategic_targets" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "action_steps" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "actionId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "action_steps_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "actions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "action_kpis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actionId" TEXT NOT NULL,
    "kpiId" TEXT NOT NULL,
    "impactScore" REAL,
    "impactCategory" TEXT,
    CONSTRAINT "action_kpis_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "actions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "action_kpis_kpiId_fkey" FOREIGN KEY ("kpiId") REFERENCES "kpis" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "simulations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "simulation_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "simulationId" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "assumedCompletion" REAL NOT NULL,
    "estimatedImpact" REAL,
    "estimatedImpactCategory" TEXT,
    CONSTRAINT "simulation_items_simulationId_fkey" FOREIGN KEY ("simulationId") REFERENCES "simulations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'string'
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "model_factories_code_key" ON "model_factories"("code");

-- CreateIndex
CREATE UNIQUE INDEX "strategic_goals_code_key" ON "strategic_goals"("code");

-- CreateIndex
CREATE UNIQUE INDEX "strategic_targets_code_key" ON "strategic_targets"("code");

-- CreateIndex
CREATE UNIQUE INDEX "kpis_number_key" ON "kpis"("number");

-- CreateIndex
CREATE UNIQUE INDEX "kpi_values_kpiId_factoryId_period_key" ON "kpi_values"("kpiId", "factoryId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "phases_name_key" ON "phases"("name");

-- CreateIndex
CREATE UNIQUE INDEX "actions_code_key" ON "actions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "action_kpis_actionId_kpiId_key" ON "action_kpis"("actionId", "kpiId");

-- CreateIndex
CREATE UNIQUE INDEX "simulation_items_simulationId_actionId_key" ON "simulation_items"("simulationId", "actionId");

-- CreateIndex
CREATE UNIQUE INDEX "settings_key_key" ON "settings"("key");
