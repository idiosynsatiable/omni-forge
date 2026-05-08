"use client";

import Link from "next/link";

interface AppRow {
  id: string;
  name: string;
  slug: string;
  category: string;
  status: string;
  port: number;
  healthScore: number;
  artifactIntegrityScore: number;
  deploymentStatus: string;
  estimatedMrr: number;
  priceMonthly: number;
}

export default function AppRegistryTable({ apps }: { apps: AppRow[] }) {
  return (
    <div className="bg-forge-surface border border-forge-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-forge-border bg-forge-bg/50">
              <th className="text-left px-4 py-3 text-forge-muted font-medium">App</th>
              <th className="text-left px-4 py-3 text-forge-muted font-medium">Category</th>
              <th className="text-left px-4 py-3 text-forge-muted font-medium">Status</th>
              <th className="text-center px-4 py-3 text-forge-muted font-medium">Health</th>
              <th className="text-center px-4 py-3 text-forge-muted font-medium">Integrity</th>
              <th className="text-left px-4 py-3 text-forge-muted font-medium">Deploy</th>
              <th className="text-right px-4 py-3 text-forge-muted font-medium">MRR</th>
              <th className="text-right px-4 py-3 text-forge-muted font-medium">Price</th>
            </tr>
          </thead>
          <tbody>
            {apps.map((app) => (
              <tr
                key={app.id}
                className="border-b border-forge-border/50 hover:bg-forge-border/20 transition-colors"
              >
                <td className="px-4 py-3">
                  <Link href={`/apps/${app.id}`} className="text-forge-cyan hover:underline font-medium">
                    {app.name}
                  </Link>
                  <p className="text-xs text-forge-muted mt-0.5">:{app.port}</p>
                </td>
                <td className="px-4 py-3 text-forge-muted">{app.category}</td>
                <td className="px-4 py-3">
                  <StatusPill status={app.status} />
                </td>
                <td className="px-4 py-3 text-center">
                  <ScorePill score={app.healthScore} />
                </td>
                <td className="px-4 py-3 text-center">
                  <ScorePill score={app.artifactIntegrityScore} />
                </td>
                <td className="px-4 py-3">
                  <DeployPill status={app.deploymentStatus} />
                </td>
                <td className="px-4 py-3 text-right text-forge-emerald font-medium">
                  ${app.estimatedMrr}
                </td>
                <td className="px-4 py-3 text-right text-forge-text">
                  ${app.priceMonthly}/mo
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: "bg-forge-muted/20 text-forge-muted",
    generated: "bg-forge-cyan/20 text-forge-cyan",
    validated: "bg-forge-emerald/20 text-forge-emerald",
    deployed: "bg-green-500/20 text-green-400",
    failed: "bg-forge-red/20 text-forge-red",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || colors.draft}`}>
      {status}
    </span>
  );
}

function ScorePill({ score }: { score: number }) {
  const color = score >= 85 ? "text-forge-emerald" : score >= 70 ? "text-forge-amber" : "text-forge-red";
  return <span className={`text-sm font-mono font-medium ${color}`}>{score}</span>;
}

function DeployPill({ status }: { status: string }) {
  const colors: Record<string, string> = {
    not_configured: "bg-forge-muted/20 text-forge-muted",
    config_generated: "bg-forge-blue/20 text-forge-blue",
    ready: "bg-forge-emerald/20 text-forge-emerald",
    blocked: "bg-forge-red/20 text-forge-red",
    deployed: "bg-green-500/20 text-green-400",
    failed: "bg-forge-red/20 text-forge-red",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || colors.not_configured}`}>
      {status}
    </span>
  );
}
