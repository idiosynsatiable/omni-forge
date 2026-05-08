export const dynamic = "force-dynamic";
import prisma from "@/lib/db";

export default async function AgentsPage() {
  const proposals = await prisma.agentProposal.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { app: { select: { name: true, slug: true } } },
  });

  const accepted = proposals.filter((p) => p.status === "accepted");
  const rejected = proposals.filter((p) => p.status === "rejected");

  const byAgent: Record<string, number> = {};
  proposals.forEach((p) => {
    byAgent[p.agentName] = (byAgent[p.agentName] || 0) + 1;
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-forge-text">🤖 Agent Swarm</h1>
        <p className="text-sm text-forge-muted mt-1">
          7 agents · {proposals.length} proposals · {accepted.length} accepted · {rejected.length} rejected
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon="🤖" label="Total Proposals" value={String(proposals.length)} />
        <StatCard icon="✅" label="Accepted" value={String(accepted.length)} accent="emerald" />
        <StatCard icon="❌" label="Rejected" value={String(rejected.length)} accent="red" />
        <StatCard icon="📊" label="Active Agents" value={String(Object.keys(byAgent).length)} accent="cyan" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-forge-surface border border-forge-border rounded-xl p-5">
          <h3 className="font-semibold text-forge-text mb-3">Agent Activity</h3>
          <div className="space-y-2">
            {Object.entries(byAgent).sort(([,a], [,b]) => (b as number) - (a as number)).map(([agent, count]) => (
              <div key={agent} className="flex items-center justify-between text-sm">
                <span className="text-forge-muted">{agent}</span>
                <span className="text-forge-text font-medium">{count as number} proposals</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-forge-surface border border-forge-border rounded-xl p-5">
          <h3 className="font-semibold text-forge-text mb-3">Agent Roster</h3>
          <div className="grid grid-cols-2 gap-2">
            {["🎯 Product", "🔧 Build", "💵 Pricing", "🛡️ Security", "🔬 QA", "🚀 Launch", "📈 Growth"].map((agent) => (
              <div key={agent} className="bg-forge-bg/50 rounded-lg p-2 text-center text-sm text-forge-muted">
                {agent}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-forge-surface border border-forge-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-forge-border">
          <h3 className="font-semibold text-forge-text">Recent Proposals</h3>
        </div>
        <div className="divide-y divide-forge-border/30">
          {proposals.slice(0, 20).map((p) => (
            <div key={p.id} className="px-5 py-3 flex items-center gap-4">
              <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                p.status === "accepted" ? "bg-forge-emerald/20 text-forge-emerald" : "bg-forge-red/20 text-forge-red"
              }`}>
                {p.status}
              </span>
              <span className="text-sm text-forge-cyan font-medium min-w-[120px]">{p.agentName}</span>
              <span className="text-sm text-forge-muted flex-1 truncate">{p.summary}</span>
              <span className="text-xs text-forge-muted">{p.app.name}</span>
              <span className="text-xs text-forge-muted">{Math.round(p.confidence * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, accent }: { icon: string; label: string; value: string; accent?: string }) {
  const color = accent === "emerald" ? "text-forge-emerald" : accent === "red" ? "text-forge-red" : accent === "cyan" ? "text-forge-cyan" : "text-forge-text";
  return (
    <div className="bg-forge-surface border border-forge-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1">
        <span>{icon}</span>
        <span className="text-xs text-forge-muted">{label}</span>
      </div>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}
