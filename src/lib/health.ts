import prisma, { dbAvailable } from "./db";

export interface AppHealthReport {
  appId: string;
  appName: string;
  score: number;
  signal: string;
  factors: string[];
}

export interface SystemHealthReport {
  status: "healthy" | "degraded" | "failing";
  service: string;
  database: { ok: boolean; reason?: string };
  system: {
    totalApps: number;
    healthy: number;
    degraded: number;
    failing: number;
    averageScore: number;
  };
  apps: AppHealthReport[];
  timestamp: string;
}

export function calculateHealthScore(app: {
  status: string;
  artifactIntegrityScore: number;
  deploymentStatus: string;
  estimatedMrr: number;
  updatedAt: Date;
}): { score: number; signal: string; factors: string[] } {
  let score = 100;
  const factors: string[] = [];

  if (app.status === "failed") {
    score -= 50;
    factors.push("App status is failed");
  } else if (app.status === "draft") {
    score -= 15;
    factors.push("App is still in draft status");
  }

  if (app.artifactIntegrityScore < 50) {
    score -= 30;
    factors.push("Artifact integrity score is below 50 (rejected)");
  } else if (app.artifactIntegrityScore < 70) {
    score -= 15;
    factors.push("Artifact integrity score is below 70 (risky)");
  }

  if (app.deploymentStatus === "failed") {
    score -= 20;
    factors.push("Deployment has failed");
  } else if (app.deploymentStatus === "blocked") {
    score -= 10;
    factors.push("Deployment is blocked");
  }

  const daysSinceUpdate = (Date.now() - app.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceUpdate > 30) {
    score -= 10;
    factors.push("Not updated in over 30 days");
  }

  if (factors.length === 0) {
    factors.push("All systems nominal");
  }

  score = Math.max(0, Math.min(100, score));
  const signal = score >= 80 ? "healthy" : score >= 50 ? "degraded" : "failing";

  return { score, signal, factors };
}

export async function getSystemHealth(): Promise<SystemHealthReport> {
  const ts = new Date().toISOString();
  const dbProbe = await dbAvailable();

  if (!dbProbe.ok) {
    // Honest "degraded" — service is reachable, DB is not.
    return {
      status: "degraded",
      service: "omni-forge",
      database: dbProbe,
      system: { totalApps: 0, healthy: 0, degraded: 0, failing: 0, averageScore: 0 },
      apps: [],
      timestamp: ts,
    };
  }

  try {
    const apps = await prisma.app.findMany();

    const appReports: AppHealthReport[] = apps.map((app) => {
      const health = calculateHealthScore(app);
      return {
        appId: app.id,
        appName: app.name,
        ...health,
      };
    });

    const healthy = appReports.filter((r) => r.signal === "healthy").length;
    const degraded = appReports.filter((r) => r.signal === "degraded").length;
    const failing = appReports.filter((r) => r.signal === "failing").length;
    const avgScore =
      appReports.length > 0
        ? Math.round(appReports.reduce((s, r) => s + r.score, 0) / appReports.length)
        : 100;

    return {
      status: failing > 0 ? "failing" : degraded > 0 ? "degraded" : "healthy",
      service: "omni-forge",
      database: { ok: true },
      system: {
        totalApps: apps.length,
        healthy,
        degraded,
        failing,
        averageScore: avgScore,
      },
      apps: appReports,
      timestamp: ts,
    };
  } catch (err) {
    const msg = (err as Error)?.message?.split("\n")[0]?.slice(0, 200) ?? "unknown error";
    return {
      status: "degraded",
      service: "omni-forge",
      database: { ok: false, reason: `query_failed: ${msg}` },
      system: { totalApps: 0, healthy: 0, degraded: 0, failing: 0, averageScore: 0 },
      apps: [],
      timestamp: ts,
    };
  }
}
