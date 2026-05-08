"use client";

interface RankedApp {
  id: string;
  name: string;
  estimatedMrr: number;
  revenueProbabilityScore: number;
  launchPriorityScore: number;
  rank: number;
  tier: string;
  underMonetized: boolean;
}

export default function RevenueRankingTable({ rankings }: { rankings: RankedApp[] }) {
  const tierColors: Record<string, string> = {
    platinum: "text-violet-400",
    gold: "text-yellow-400",
    silver: "text-gray-300",
    bronze: "text-orange-400",
    none: "text-forge-muted",
  };

  return (
    <div className="bg-forge-surface border border-forge-border rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-forge-border">
        <h3 className="font-semibold text-forge-text">📊 Revenue Rankings</h3>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-forge-border bg-forge-bg/30">
            <th className="text-center px-3 py-2 text-forge-muted font-medium">#</th>
            <th className="text-left px-3 py-2 text-forge-muted font-medium">App</th>
            <th className="text-center px-3 py-2 text-forge-muted font-medium">Tier</th>
            <th className="text-right px-3 py-2 text-forge-muted font-medium">MRR</th>
            <th className="text-center px-3 py-2 text-forge-muted font-medium">Prob</th>
            <th className="text-center px-3 py-2 text-forge-muted font-medium">Priority</th>
          </tr>
        </thead>
        <tbody>
          {rankings.map((app) => (
            <tr
              key={app.id}
              className={`border-b border-forge-border/30 ${app.underMonetized ? "bg-forge-amber/5" : ""}`}
            >
              <td className="text-center px-3 py-2 font-mono text-forge-muted">{app.rank}</td>
              <td className="px-3 py-2">
                <span className="text-forge-text font-medium">{app.name}</span>
                {app.underMonetized && (
                  <span className="ml-2 px-1.5 py-0.5 bg-forge-amber/20 text-forge-amber rounded text-[10px]">
                    Under-monetized
                  </span>
                )}
              </td>
              <td className={`text-center px-3 py-2 font-medium ${tierColors[app.tier]}`}>
                {app.tier}
              </td>
              <td className="text-right px-3 py-2 text-forge-emerald font-medium">${app.estimatedMrr}</td>
              <td className="text-center px-3 py-2 text-forge-muted">{app.revenueProbabilityScore}%</td>
              <td className="text-center px-3 py-2 text-forge-muted">{app.launchPriorityScore}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
