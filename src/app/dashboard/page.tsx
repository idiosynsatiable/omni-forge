export const dynamic = "force-dynamic";
import prisma from "@/lib/db";
import { getAnalyticsSummary } from "@/lib/analytics";
import { getSystemHealth } from "@/lib/health";
import { getNextBestApps } from "@/lib/revenue/next-best-app";
import NextBestAppPanel from "@/components/NextBestAppPanel";
import CashSaasStatusPanel from "@/components/CashSaasStatusPanel";

export default async function DashboardPage() {
  const summary = await getAnalyticsSummary();
  const health = await getSystemHealth();
  const apps = await prisma.app.findMany({ select: { slug: true } });
  const nextBest = getNextBestApps(apps.map((a) => a.slug), 3);

  const topApp = health.apps.sort((a, b) => b.score - a.score)[0];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-forge-text">⚡ Control Plane</h1>
        <p className="text-sm text-forge-muted mt-1">Omni-Forge Phase 3 — Autonomous Foundry Command Center</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard icon="🚀" label="Total Apps" value={String(summary.totalApps)} />
        <MetricCard icon="✅" label="Deploy-Ready" value={String(summary.deployReady)} accent="emerald" />
        <MetricCard icon="🚫" label="Blocked" value={String(summary.byStatus["failed"] || 0)} accent="red" />
        <MetricCard icon="💰" label="Portfolio MRR" value={`$${summary.totalEstimatedMrr}`} accent="emerald" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard icon="🏆" label="Top Candidate" value={topApp?.appName || "None"} />
        <MetricCard icon="🔬" label="Avg Integrity" value={String(summary.averageArtifactScore)} accent={summary.averageArtifactScore >= 85 ? "emerald" : "amber"} />
        <MetricCard icon="❤️" label="Fleet Health" value={`${health.system.averageScore}%`} accent={health.system.averageScore >= 80 ? "emerald" : "amber"} />
        <MetricCard icon="🤖" label="Agent Proposals" value={String(summary.recentProposals)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-forge-surface border border-forge-border rounded-xl p-5">
          <h3 className="font-semibold text-forge-text mb-3">📊 Fleet Status</h3>
          <div className="space-y-2">
            {Object.entries(summary.byStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between text-sm">
                <span className="text-forge-muted capitalize">{status}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-forge-bg rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-forge-cyan/50"
                      style={{ width: `${summary.totalApps > 0 ? ((count as number) / summary.totalApps) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-forge-text font-medium w-6 text-right">{count as number}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-forge-surface border border-forge-border rounded-xl p-5">
          <h3 className="font-semibold text-forge-text mb-3">🏪 Marketplace</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-forge-muted">Listed Apps</span>
              <span className="text-forge-text font-medium">{summary.marketplaceListed}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-forge-muted">Categories</span>
              <span className="text-forge-text font-medium">{Object.keys(summary.byCategory).length}</span>
            </div>
            {Object.entries(summary.byCategory).map(([cat, count]) => (
              <div key={cat} className="flex items-center justify-between text-sm">
                <span className="text-forge-muted/70 text-xs">{cat}</span>
                <span className="text-forge-muted text-xs">{count as number}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <NextBestAppPanel candidates={nextBest} />

      <CashSaasStatusPanel />
    </div>
  );
}

function MetricCard({ icon, label, value, accent }: { icon: string; label: string; value: string; accent?: string }) {
  const color =
    accent === "emerald" ? "text-forge-emerald" :
    accent === "red" ? "text-forge-red" :
    accent === "amber" ? "text-forge-amber" :
    "text-forge-text";

  return (
    <div className="bg-forge-surface border border-forge-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <span>{icon}</span>
        <span className="text-xs text-forge-muted">{label}</span>
      </div>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}
