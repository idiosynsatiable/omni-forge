"use client";

interface Proposal {
  agentName: string;
  proposalType: string;
  confidence: number;
  summary: string;
  recommendedActions: string[];
  risks: string[];
}

interface Props {
  accepted: Proposal[];
  rejected: Proposal[];
  commitLog: string[];
}

const AGENT_ICONS: Record<string, string> = {
  "Product Agent": "🎯",
  "Build Agent": "🔧",
  "Pricing Agent": "💵",
  "Security Agent": "🛡️",
  "QA Agent": "🔬",
  "Launch Agent": "🚀",
  "Growth Agent": "📈",
};

export default function AgentSwarmPanel({ accepted, rejected, commitLog }: Props) {
  return (
    <div className="space-y-4">
      <div className="bg-forge-surface border border-forge-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-forge-text">🤖 Agent Swarm Results</h3>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-forge-emerald">{accepted.length} accepted</span>
            <span className="text-forge-red">{rejected.length} rejected</span>
          </div>
        </div>

        <div className="space-y-3">
          {accepted.map((p, i) => (
            <ProposalCard key={i} proposal={p} status="accepted" />
          ))}
          {rejected.map((p, i) => (
            <ProposalCard key={`r-${i}`} proposal={p} status="rejected" />
          ))}
        </div>
      </div>

      {commitLog.length > 0 && (
        <div className="bg-forge-surface border border-forge-border rounded-xl p-5">
          <h3 className="font-semibold text-forge-text mb-3">📋 Commit Log</h3>
          <div className="space-y-1 font-mono text-xs max-h-40 overflow-y-auto">
            {commitLog.map((entry, i) => (
              <p key={i} className={`${
                entry.startsWith("[ACCEPT]") ? "text-forge-emerald" :
                entry.startsWith("[REJECT]") ? "text-forge-red" :
                "text-forge-muted"
              }`}>
                {entry}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ProposalCard({ proposal, status }: { proposal: Proposal; status: string }) {
  const icon = AGENT_ICONS[proposal.agentName] || "🤖";

  return (
    <div className={`border rounded-lg p-4 ${
      status === "accepted" ? "border-forge-emerald/20 bg-forge-emerald/5" : "border-forge-red/20 bg-forge-red/5"
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span>{icon}</span>
          <span className="font-medium text-forge-text text-sm">{proposal.agentName}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-forge-muted">{Math.round(proposal.confidence * 100)}%</span>
          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
            status === "accepted" ? "bg-forge-emerald/20 text-forge-emerald" : "bg-forge-red/20 text-forge-red"
          }`}>
            {status}
          </span>
        </div>
      </div>
      <p className="text-sm text-forge-muted mb-2">{proposal.summary}</p>
      {proposal.recommendedActions.length > 0 && (
        <div className="mt-2">
          <p className="text-xs text-forge-muted font-medium mb-1">Actions:</p>
          {proposal.recommendedActions.slice(0, 3).map((action, i) => (
            <p key={i} className="text-xs text-forge-muted/80 ml-2">• {action}</p>
          ))}
          {proposal.recommendedActions.length > 3 && (
            <p className="text-xs text-forge-muted/60 ml-2">+ {proposal.recommendedActions.length - 3} more</p>
          )}
        </div>
      )}
    </div>
  );
}
