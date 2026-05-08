"use client";

interface Issue {
  severity: string;
  category: string;
  message: string;
  line: number;
  matchedText: string;
  suggestedFix: string;
}

interface Props {
  passed: boolean;
  artifactScore: { score: number; label: string; breakdown: Record<string, number> };
  issues: Issue[];
  filesScanned: number;
}

export default function ValidationGatePanel({ passed, artifactScore, issues, filesScanned }: Props) {
  const critical = issues.filter((i) => i.severity === "critical").length;
  const major = issues.filter((i) => i.severity === "major").length;
  const minor = issues.filter((i) => i.severity === "minor").length;

  return (
    <div className="bg-forge-surface border border-forge-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-forge-text">🔬 Validation Gate</h3>
        <span className={`px-3 py-1 rounded-lg text-sm font-bold ${
          passed ? "bg-forge-emerald/10 text-forge-emerald border border-forge-emerald/20" :
          "bg-forge-red/10 text-forge-red border border-forge-red/20"
        }`}>
          {passed ? "PASSED" : "BLOCKED"}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <MiniStat label="Score" value={String(artifactScore.score)} color={
          artifactScore.score >= 85 ? "text-forge-emerald" : artifactScore.score >= 70 ? "text-forge-amber" : "text-forge-red"
        } />
        <MiniStat label="Label" value={artifactScore.label} color="text-forge-cyan" />
        <MiniStat label="Files Scanned" value={String(filesScanned)} color="text-forge-violet" />
        <MiniStat label="Issues" value={String(issues.length)} color={issues.length === 0 ? "text-forge-emerald" : "text-forge-amber"} />
      </div>

      <div className="flex items-center gap-4 mb-4 text-sm">
        <span className="text-forge-red">Critical: {critical}</span>
        <span className="text-forge-amber">Major: {major}</span>
        <span className="text-forge-muted">Minor: {minor}</span>
      </div>

      {issues.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {issues.map((issue, i) => (
            <div key={i} className="flex items-start gap-2 text-sm border-l-2 pl-3 py-1 ${
              issue.severity === 'critical' ? 'border-forge-red' :
              issue.severity === 'major' ? 'border-forge-amber' : 'border-forge-muted'
            }">
              <span className={`px-1 py-0.5 rounded text-[10px] font-medium shrink-0 ${
                issue.severity === "critical" ? "bg-forge-red/20 text-forge-red" :
                issue.severity === "major" ? "bg-forge-amber/20 text-forge-amber" :
                "bg-forge-muted/20 text-forge-muted"
              }`}>
                {issue.severity}
              </span>
              <div>
                <p className="text-forge-text/80">{issue.message}</p>
                {issue.suggestedFix && (
                  <p className="text-forge-cyan/60 text-xs mt-0.5">Fix: {issue.suggestedFix}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-forge-bg/50 rounded-lg p-2 text-center">
      <p className="text-[10px] text-forge-muted">{label}</p>
      <p className={`text-sm font-bold ${color}`}>{value}</p>
    </div>
  );
}
