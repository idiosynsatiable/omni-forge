"use client";

import HealthBadge from "./HealthBadge";
import ArtifactIntegrityBadge from "./ArtifactIntegrityBadge";

interface AppDetail {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  status: string;
  port: number;
  healthScore: number;
  artifactIntegrityScore: number;
  deploymentStatus: string;
  deploymentProvider: string;
  liveUrl: string;
  revenueMode: string;
  priceMonthly: number;
  estimatedMrr: number;
  revenueProbabilityScore: number;
  launchPriorityScore: number;
  marketplaceListed: boolean;
  generatedFiles: Array<{ id: string; path: string; fileType: string }>;
  validationIssues: Array<{ id: string; severity: string; message: string; category: string }>;
  agentProposals: Array<{ id: string; agentName: string; summary: string; confidence: number; status: string }>;
}

export default function AppDetailPanel({ app }: { app: AppDetail }) {
  return (
    <div className="space-y-6">
      <div className="bg-forge-surface border border-forge-border rounded-xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-forge-text">{app.name}</h2>
            <p className="text-forge-muted mt-1">{app.slug} · Port {app.port}</p>
          </div>
          <div className="flex items-center gap-3">
            <HealthBadge score={app.healthScore} />
            <ArtifactIntegrityBadge score={app.artifactIntegrityScore} />
          </div>
        </div>
        <p className="text-forge-text/80 mb-4">{app.description}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatBox label="Status" value={app.status} />
          <StatBox label="Category" value={app.category} />
          <StatBox label="Revenue Mode" value={app.revenueMode} />
          <StatBox label="Price" value={`$${app.priceMonthly}/mo`} accent />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard label="Estimated MRR" value={`$${app.estimatedMrr}`} icon="💰" />
        <MetricCard label="Revenue Probability" value={`${app.revenueProbabilityScore}%`} icon="📊" />
        <MetricCard label="Launch Priority" value={`${app.launchPriorityScore}`} icon="🚀" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-forge-surface border border-forge-border rounded-xl p-5">
          <h3 className="font-semibold text-forge-text mb-3">📦 Deployment</h3>
          <div className="space-y-2 text-sm">
            <InfoRow label="Status" value={app.deploymentStatus} />
            <InfoRow label="Provider" value={app.deploymentProvider || "none"} />
            <InfoRow label="Live URL" value={app.liveUrl || "Not deployed"} />
            <InfoRow label="Marketplace" value={app.marketplaceListed ? "Listed" : "Not listed"} />
          </div>
        </div>

        <div className="bg-forge-surface border border-forge-border rounded-xl p-5">
          <h3 className="font-semibold text-forge-text mb-3">📁 Generated Files ({app.generatedFiles.length})</h3>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {app.generatedFiles.map((f) => (
              <div key={f.id} className="text-sm text-forge-muted flex items-center gap-2">
                <span className="text-forge-cyan">•</span>
                <span className="font-mono text-xs">{f.path}</span>
                <span className="text-xs text-forge-muted/60">({f.fileType})</span>
              </div>
            ))}
            {app.generatedFiles.length === 0 && (
              <p className="text-sm text-forge-muted">No files generated yet</p>
            )}
          </div>
        </div>
      </div>

      {app.validationIssues.length > 0 && (
        <div className="bg-forge-surface border border-forge-border rounded-xl p-5">
          <h3 className="font-semibold text-forge-text mb-3">
            🔬 Validation Issues ({app.validationIssues.length})
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {app.validationIssues.map((issue) => (
              <div key={issue.id} className="flex items-start gap-3 text-sm">
                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                  issue.severity === "critical" ? "bg-forge-red/20 text-forge-red" :
                  issue.severity === "major" ? "bg-forge-amber/20 text-forge-amber" :
                  "bg-forge-muted/20 text-forge-muted"
                }`}>
                  {issue.severity}
                </span>
                <span className="text-forge-text/80">{issue.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {app.agentProposals.length > 0 && (
        <div className="bg-forge-surface border border-forge-border rounded-xl p-5">
          <h3 className="font-semibold text-forge-text mb-3">
            🤖 Agent Proposals ({app.agentProposals.length})
          </h3>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {app.agentProposals.map((p) => (
              <div key={p.id} className="border border-forge-border/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-forge-cyan">{p.agentName}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-forge-muted">
                      {Math.round(p.confidence * 100)}% confidence
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-xs ${
                      p.status === "accepted" ? "bg-forge-emerald/20 text-forge-emerald" :
                      "bg-forge-red/20 text-forge-red"
                    }`}>
                      {p.status}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-forge-muted">{p.summary}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-forge-bg/50 rounded-lg p-3">
      <p className="text-xs text-forge-muted mb-1">{label}</p>
      <p className={`text-sm font-semibold ${accent ? "text-forge-emerald" : "text-forge-text"}`}>{value}</p>
    </div>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="bg-forge-surface border border-forge-border rounded-xl p-4 flex items-center gap-3">
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="text-xs text-forge-muted">{label}</p>
        <p className="text-lg font-bold text-forge-text">{value}</p>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-forge-muted">{label}</span>
      <span className="text-forge-text font-medium">{value}</span>
    </div>
  );
}
