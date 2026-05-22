-- CreateEnum
CREATE TYPE "CrmClientStatus" AS ENUM ('LEAD', 'ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "CrmProjectStatus" AS ENUM ('DISCOVERY', 'PROPOSAL', 'ACTIVE', 'REVIEW', 'COMPLETED', 'ON_HOLD', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CrmInvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateTable
CREATE TABLE "CrmClient" (
    "id"        TEXT             NOT NULL,
    "createdAt" TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3)     NOT NULL,
    "name"      TEXT             NOT NULL,
    "company"   TEXT,
    "email"     TEXT             NOT NULL,
    "phone"     TEXT,
    "country"   TEXT,
    "status"    "CrmClientStatus" NOT NULL DEFAULT 'LEAD',
    "notes"     TEXT,
    "tags"      TEXT[]           NOT NULL DEFAULT ARRAY[]::TEXT[],
    CONSTRAINT "CrmClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmProject" (
    "id"          TEXT              NOT NULL,
    "createdAt"   TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3)      NOT NULL,
    "title"       TEXT              NOT NULL,
    "description" TEXT,
    "status"      "CrmProjectStatus" NOT NULL DEFAULT 'DISCOVERY',
    "budget"      DOUBLE PRECISION,
    "currency"    TEXT              NOT NULL DEFAULT 'USD',
    "startDate"   TIMESTAMP(3),
    "endDate"     TIMESTAMP(3),
    "notes"       TEXT[]            NOT NULL DEFAULT ARRAY[]::TEXT[],
    "clientId"    TEXT              NOT NULL,
    CONSTRAINT "CrmProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmInvoice" (
    "id"            TEXT              NOT NULL,
    "createdAt"     TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3)      NOT NULL,
    "invoiceNumber" TEXT              NOT NULL,
    "amount"        DOUBLE PRECISION  NOT NULL,
    "currency"      TEXT              NOT NULL DEFAULT 'USD',
    "status"        "CrmInvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "issuedAt"      TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt"         TIMESTAMP(3),
    "paidAt"        TIMESTAMP(3),
    "notes"         TEXT,
    "clientId"      TEXT              NOT NULL,
    "projectId"     TEXT,
    CONSTRAINT "CrmInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CrmInvoice_invoiceNumber_key" ON "CrmInvoice"("invoiceNumber");
CREATE INDEX "CrmClient_email_idx"             ON "CrmClient"("email");
CREATE INDEX "CrmClient_status_createdAt_idx"  ON "CrmClient"("status", "createdAt");
CREATE INDEX "CrmProject_clientId_idx"          ON "CrmProject"("clientId");
CREATE INDEX "CrmProject_status_createdAt_idx" ON "CrmProject"("status", "createdAt");
CREATE INDEX "CrmInvoice_clientId_idx"          ON "CrmInvoice"("clientId");
CREATE INDEX "CrmInvoice_projectId_idx"         ON "CrmInvoice"("projectId");
CREATE INDEX "CrmInvoice_status_issuedAt_idx"  ON "CrmInvoice"("status", "issuedAt");

-- AddForeignKey
ALTER TABLE "CrmProject" ADD CONSTRAINT "CrmProject_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "CrmClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmInvoice" ADD CONSTRAINT "CrmInvoice_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "CrmClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmInvoice" ADD CONSTRAINT "CrmInvoice_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "CrmProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
