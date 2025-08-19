-- AlterTable
ALTER TABLE "kpi_evidence" ADD COLUMN "employees" INTEGER;
ALTER TABLE "kpi_evidence" ADD COLUMN "firmIdHash" TEXT;
ALTER TABLE "kpi_evidence" ADD COLUMN "hasExport" BOOLEAN;
ALTER TABLE "kpi_evidence" ADD COLUMN "meta" JSONB;
ALTER TABLE "kpi_evidence" ADD COLUMN "nace2d" TEXT;
ALTER TABLE "kpi_evidence" ADD COLUMN "nace4d" TEXT;
ALTER TABLE "kpi_evidence" ADD COLUMN "province" TEXT;
ALTER TABLE "kpi_evidence" ADD COLUMN "revenue" REAL;
ALTER TABLE "kpi_evidence" ADD COLUMN "zoneType" TEXT;
