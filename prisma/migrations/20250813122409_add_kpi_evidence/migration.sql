-- CreateTable
CREATE TABLE "kpi_evidence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kpiId" TEXT NOT NULL,
    "factoryId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "uploadedBy" TEXT,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "kpi_evidence_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "kpi_evidence_kpiId_fkey" FOREIGN KEY ("kpiId") REFERENCES "kpis" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "kpi_evidence_factoryId_fkey" FOREIGN KEY ("factoryId") REFERENCES "model_factories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "kpi_evidence_kpiId_factoryId_period_idx" ON "kpi_evidence"("kpiId", "factoryId", "period");
