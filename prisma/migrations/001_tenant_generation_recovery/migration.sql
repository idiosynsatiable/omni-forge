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

-- The legacy schema made slug globally unique. After every legacy row has
-- been quarantined into organizationId=0, the uniqueness boundary can move
-- safely to (organizationId, slug) without cross-tenant collisions.
DROP INDEX "App_slug_key";

CREATE INDEX "App_organizationId_createdAt_idx"
    ON "App"("organizationId", "createdAt");

CREATE INDEX "App_organizationId_status_idx"
    ON "App"("organizationId", "status");

CREATE UNIQUE INDEX "App_organizationId_slug_key"
    ON "App"("organizationId", "slug");

CREATE UNIQUE INDEX "App_organizationId_idempotencyKey_key"
    ON "App"("organizationId", "idempotencyKey");
