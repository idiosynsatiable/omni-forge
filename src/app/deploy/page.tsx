export const dynamic = "force-dynamic";
import prisma from "@/lib/db";

export default async function DeployPage() {
  const apps = await prisma.app.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      deploymentChecks: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const statusCounts = {
    ready: apps.filter((a) => a.deploymentStatus === "ready").length,
    config_generated: apps.filter((a) => a.deploymentStatus === "config_generated").length,
    blocked: apps.filter((a) => a.deploymentStatus === "blocked").length,
    deployed: apps.filter((a) => a.deploymentStatus === "deployed").length,
    not_configured: apps.filter((a) => a.deploymentStatus === "not_configured").length,
    failed: apps.filter((a) => a.deploymentStatus === "failed").length,
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-forge-text">📦 Deploy Center</h1>
        <p className="text-sm text-forge-muted mt-1">Deployment readiness and configuration management</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Object.entries(statusCounts).map(([status, count]) => (
          <div key={status} className="bg-forge-surface border border-forge-border rounded-xl p-4 text-center">
            <p className="text-xs text-forge-muted mb-1 capitalize">{status.replace("_", " ")}</p>
            <p className="text-xl font-bold text-forge-text">{count}</p>
          </div>
        ))}
      </div>

      <div className="bg-forge-surface border border-forge-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-forge-border bg-forge-bg/30">
              <th className="text-left px-4 py-3 text-forge-muted font-medium">App</th>
              <th className="text-left px-4 py-3 text-forge-muted font-medium">Deploy Status</th>
              <th className="text-left px-4 py-3 text-forge-muted font-medium">Provider</th>
              <th className="text-center px-4 py-3 text-forge-muted font-medium">Score</th>
              <th className="text-left px-4 py-3 text-forge-muted font-medium">Last Check</th>
            </tr>
          </thead>
          <tbody>
            {apps.map((app) => {
              const lastCheck = app.deploymentChecks[0];
              return (
                <tr key={app.id} className="border-b border-forge-border/30 hover:bg-forge-border/20">
                  <td className="px-4 py-3">
                    <span className="text-forge-text font-medium">{app.name}</span>
                    <p className="text-xs text-forge-muted">:{app.port}</p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={app.deploymentStatus} />
                  </td>
                  <td className="px-4 py-3 text-forge-muted">{app.deploymentProvider || "—"}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-mono font-medium ${
                      (lastCheck?.readinessScore ?? 0) === 100 ? "text-forge-emerald" :
                      (lastCheck?.readinessScore ?? 0) >= 80 ? "text-forge-amber" : "text-forge-red"
                    }`}>
                      {lastCheck?.readinessScore ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-forge-muted text-xs">
                    {lastCheck ? new Date(lastCheck.createdAt).toLocaleDateString() : "Never"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const colors: Record<string, string> = {
    ready: "bg-forge-emerald/20 text-forge-emerald",
    config_generated: "bg-forge-blue/20 text-forge-blue",
    deployed: "bg-green-500/20 text-green-400",
    blocked: "bg-forge-red/20 text-forge-red",
    failed: "bg-forge-red/20 text-forge-red",
    not_configured: "bg-forge-muted/20 text-forge-muted",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || colors.not_configured}`}>
      {status.replace("_", " ")}
    </span>
  );
}
