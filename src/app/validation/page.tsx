export const dynamic = "force-dynamic";
import prisma from "@/lib/db";

export default async function ValidationPage() {
  const apps = await prisma.app.findMany({
    orderBy: { artifactIntegrityScore: "desc" },
    include: {
      _count: { select: { validationIssues: true } },
      validationIssues: { take: 3, orderBy: { createdAt: "desc" } },
    },
  });

  const pristine = apps.filter((a) => a.artifactIntegrityScore >= 95).length;
  const strong = apps.filter((a) => a.artifactIntegrityScore >= 85 && a.artifactIntegrityScore < 95).length;
  const acceptable = apps.filter((a) => a.artifactIntegrityScore >= 70 && a.artifactIntegrityScore < 85).length;
  const risky = apps.filter((a) => a.artifactIntegrityScore >= 50 && a.artifactIntegrityScore < 70).length;
  const rejected = apps.filter((a) => a.artifactIntegrityScore < 50).length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-forge-text">🔬 Validation Gate</h1>
        <p className="text-sm text-forge-muted mt-1">TemplateForge artifact integrity and compliance scanning</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <ScoreCard label="Pristine (95+)" count={pristine} color="text-forge-emerald" />
        <ScoreCard label="Strong (85+)" count={strong} color="text-forge-cyan" />
        <ScoreCard label="Acceptable (70+)" count={acceptable} color="text-forge-amber" />
        <ScoreCard label="Risky (50+)" count={risky} color="text-orange-400" />
        <ScoreCard label="Rejected (<50)" count={rejected} color="text-forge-red" />
      </div>

      <div className="bg-forge-surface border border-forge-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-forge-border bg-forge-bg/30">
              <th className="text-left px-4 py-3 text-forge-muted font-medium">App</th>
              <th className="text-center px-4 py-3 text-forge-muted font-medium">Score</th>
              <th className="text-center px-4 py-3 text-forge-muted font-medium">Label</th>
              <th className="text-center px-4 py-3 text-forge-muted font-medium">Issues</th>
              <th className="text-left px-4 py-3 text-forge-muted font-medium">Latest Issues</th>
            </tr>
          </thead>
          <tbody>
            {apps.map((app) => {
              const score = app.artifactIntegrityScore;
              const label = score >= 95 ? "Pristine" : score >= 85 ? "Strong" : score >= 70 ? "Acceptable" : score >= 50 ? "Risky" : "Rejected";
              const color = score >= 95 ? "text-forge-emerald" : score >= 85 ? "text-forge-cyan" : score >= 70 ? "text-forge-amber" : score >= 50 ? "text-orange-400" : "text-forge-red";

              return (
                <tr key={app.id} className="border-b border-forge-border/30 hover:bg-forge-border/20">
                  <td className="px-4 py-3">
                    <span className="text-forge-text font-medium">{app.name}</span>
                    <p className="text-xs text-forge-muted">{app.slug}</p>
                  </td>
                  <td className={`px-4 py-3 text-center font-mono font-bold ${color}`}>{score}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${color} bg-current/10`}>
                      {label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-forge-muted">{app._count.validationIssues}</td>
                  <td className="px-4 py-3">
                    {app.validationIssues.map((issue) => (
                      <p key={issue.id} className="text-xs text-forge-muted truncate max-w-xs">
                        <span className={`font-medium ${
                          issue.severity === "critical" ? "text-forge-red" :
                          issue.severity === "major" ? "text-forge-amber" : "text-forge-muted"
                        }`}>
                          [{issue.severity}]
                        </span>{" "}
                        {issue.message}
                      </p>
                    ))}
                    {app._count.validationIssues === 0 && (
                      <span className="text-xs text-forge-emerald">Clean ✓</span>
                    )}
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

function ScoreCard({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="bg-forge-surface border border-forge-border rounded-xl p-4 text-center">
      <p className="text-xs text-forge-muted mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{count}</p>
    </div>
  );
}
