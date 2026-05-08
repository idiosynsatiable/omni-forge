"use client";

interface ReadinessCheck {
  name: string;
  passed: boolean;
  detail: string;
}

interface Props {
  score: number;
  status: string;
  checks: ReadinessCheck[];
  missingItems: string[];
}

export default function DeploymentReadinessPanel({ score, status, checks, missingItems }: Props) {
  return (
    <div className="bg-forge-surface border border-forge-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-forge-text">📦 Deployment Readiness</h3>
        <div className="flex items-center gap-2">
          <span className={`text-lg font-bold ${
            score === 100 ? "text-forge-emerald" : score >= 80 ? "text-forge-amber" : "text-forge-red"
          }`}>
            {score}%
          </span>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
            status === "ready" ? "bg-forge-emerald/20 text-forge-emerald" :
            status === "config_generated" ? "bg-forge-blue/20 text-forge-blue" :
            "bg-forge-red/20 text-forge-red"
          }`}>
            {status}
          </span>
        </div>
      </div>

      <div className="w-full bg-forge-bg rounded-full h-2 mb-4">
        <div
          className={`h-2 rounded-full transition-all ${
            score === 100 ? "bg-forge-emerald" : score >= 80 ? "bg-forge-amber" : "bg-forge-red"
          }`}
          style={{ width: `${score}%` }}
        />
      </div>

      <div className="space-y-2">
        {checks.map((check) => (
          <div key={check.name} className="flex items-center gap-2 text-sm">
            <span className={check.passed ? "text-forge-emerald" : "text-forge-red"}>
              {check.passed ? "✓" : "✗"}
            </span>
            <span className={check.passed ? "text-forge-muted" : "text-forge-text"}>
              {check.detail}
            </span>
          </div>
        ))}
      </div>

      {missingItems.length > 0 && (
        <div className="mt-4 p-3 bg-forge-red/5 border border-forge-red/20 rounded-lg">
          <p className="text-xs text-forge-red font-medium mb-1">Missing Items:</p>
          {missingItems.map((item) => (
            <p key={item} className="text-xs text-forge-red/80">• {item}</p>
          ))}
        </div>
      )}
    </div>
  );
}
