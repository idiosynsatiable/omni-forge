-- Omni-Forge pre-hardening schema baseline.
--
-- Fresh databases execute this migration normally. Existing databases that
-- already contain this schema must mark `000_baseline` applied exactly once
-- before `prisma migrate deploy`; see prisma/BASELINE.md.

CREATE TABLE "App" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'utility',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "port" INTEGER NOT NULL DEFAULT 4100,
    "healthScore" INTEGER NOT NULL DEFAULT 100,
    "artifactIntegrityScore" INTEGER NOT NULL DEFAULT 0,
    "deploymentStatus" TEXT NOT NULL DEFAULT 'not_configured',
    "deploymentProvider" TEXT NOT NULL DEFAULT 'none',
    "liveUrl" TEXT NOT NULL DEFAULT '',
    "revenueMode" TEXT NOT NULL DEFAULT 'freemium',
    "priceMonthly" DOUBLE PRECISION NOT NULL DEFAULT 19,
    "usageUnitPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estimatedMrr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "revenueProbabilityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "launchPriorityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "marketplaceListed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "App_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GeneratedFile" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "fileType" TEXT NOT NULL DEFAULT 'source',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GeneratedFile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ValidationIssue" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'minor',
    "category" TEXT NOT NULL DEFAULT 'general',
    "message" TEXT NOT NULL,
    "lineNumber" INTEGER NOT NULL DEFAULT 0,
    "matchedText" TEXT NOT NULL DEFAULT '',
    "suggestedFix" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ValidationIssue_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgentProposal" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "agentName" TEXT NOT NULL,
    "proposalType" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "summary" TEXT NOT NULL,
    "recommendedActionsJson" TEXT NOT NULL DEFAULT '[]',
    "risksJson" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgentProposal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MarketplaceListing" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'utility',
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cloneCount" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MarketplaceListing_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RevenueSnapshot" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "visitorsPerMonth" INTEGER NOT NULL DEFAULT 1000,
    "conversionRate" DOUBLE PRECISION NOT NULL DEFAULT 0.04,
    "churnRate" DOUBLE PRECISION NOT NULL DEFAULT 0.05,
    "averagePrice" DOUBLE PRECISION NOT NULL DEFAULT 29,
    "grossMargin" DOUBLE PRECISION NOT NULL DEFAULT 0.85,
    "estimatedMrr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "retentionAdjustedRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RevenueSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DeploymentCheck" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'generic',
    "readinessScore" INTEGER NOT NULL DEFAULT 0,
    "missingItemsJson" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DeploymentCheck_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "App_slug_key" ON "App"("slug");
CREATE UNIQUE INDEX "MarketplaceListing_appId_key" ON "MarketplaceListing"("appId");

ALTER TABLE "GeneratedFile"
    ADD CONSTRAINT "GeneratedFile_appId_fkey"
    FOREIGN KEY ("appId") REFERENCES "App"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ValidationIssue"
    ADD CONSTRAINT "ValidationIssue_appId_fkey"
    FOREIGN KEY ("appId") REFERENCES "App"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AgentProposal"
    ADD CONSTRAINT "AgentProposal_appId_fkey"
    FOREIGN KEY ("appId") REFERENCES "App"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MarketplaceListing"
    ADD CONSTRAINT "MarketplaceListing_appId_fkey"
    FOREIGN KEY ("appId") REFERENCES "App"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RevenueSnapshot"
    ADD CONSTRAINT "RevenueSnapshot_appId_fkey"
    FOREIGN KEY ("appId") REFERENCES "App"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DeploymentCheck"
    ADD CONSTRAINT "DeploymentCheck_appId_fkey"
    FOREIGN KEY ("appId") REFERENCES "App"("id") ON DELETE CASCADE ON UPDATE CASCADE;
