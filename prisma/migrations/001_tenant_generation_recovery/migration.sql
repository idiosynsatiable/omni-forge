-- Tenant isolation + resumable/idempotent generation.
-- Existing rows are quarantined as organizationId=0. No legacy record is
-- silently attributed to a real customer organization.

ALTER TABLE "App"
    ADD COLUMN "organizationId" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "createdByUserId" INTEGER,
    ADD COLUMN "idempotencyKey" TEXT,
    ADD COLUMN "requestHash" TEXT,
    ADD COLUMN "generationAttempt" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "lastGenerationError" TEXT NOT NULL DEFAULT '';

CREATE INDEX "App_organizationId_createdAt_idx"
    ON "App"("organizationId", "createdAt");

CREATE INDEX "App_organizationId_status_idx"
    ON "App"("organizationId", "status");

CREATE UNIQUE INDEX "App_organizationId_idempotencyKey_key"
    ON "App"("organizationId", "idempotencyKey");
