import prisma from "./db";

export interface AnalyticsSummary {
  totalApps: number;
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
  totalEstimatedMrr: number;
  averageArtifactScore: number;
  deployReady: number;
  marketplaceListed: number;
  recentProposals: number;
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const apps = await prisma.app.findMany();

  const byStatus: Record<string, number> = {};
  const byCategory: Record<string, number> = {};
  let totalMrr = 0;
  let totalArtifact = 0;
  let deployReady = 0;
  let listed = 0;

  for (const app of apps) {
    byStatus[app.status] = (byStatus[app.status] || 0) + 1;
    byCategory[app.category] = (byCategory[app.category] || 0) + 1;
    totalMrr += app.estimatedMrr;
    totalArtifact += app.artifactIntegrityScore;
    if (app.deploymentStatus === "ready" || app.deploymentStatus === "deployed") {
      deployReady++;
    }
    if (app.marketplaceListed) listed++;
  }

  const recentProposals = await prisma.agentProposal.count({
    where: {
      createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    },
  });

  return {
    totalApps: apps.length,
    byStatus,
    byCategory,
    totalEstimatedMrr: Math.round(totalMrr * 100) / 100,
    averageArtifactScore:
      apps.length > 0 ? Math.round(totalArtifact / apps.length) : 0,
    deployReady,
    marketplaceListed: listed,
    recentProposals,
  };
}
