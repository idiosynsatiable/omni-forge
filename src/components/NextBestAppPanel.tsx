"use client";

interface Candidate {
  name: string;
  description: string;
  category: string;
  scores: {
    demandScore: number;
    buildSimplicity: number;
    monetizationFit: number;
    deploymentReadiness: number;
    differentiationScore: number;
  };
  totalScore: number;
  recommendedPrice: number;
  estimatedTimeToLaunch: string;
}

export default function NextBestAppPanel({ candidates }: { candidates: Candidate[] }) {
  return (
    <div className="bg-forge-surface border border-forge-border rounded-xl p-5">
      <h3 className="font-semibold text-forge-text mb-4">🎯 Next Best Apps to Build</h3>
      <div className="space-y-3">
        {candidates.map((c, i) => (
          <div key={i} className="border border-forge-border/50 rounded-lg p-4 hover:border-forge-cyan/20 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="text-sm font-semibold text-forge-text">{c.name}</h4>
                <span className="text-xs text-forge-muted">{c.category}</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-forge-cyan">{c.totalScore.toFixed(1)}</span>
                <p className="text-[10px] text-forge-muted">composite score</p>
              </div>
            </div>
            <p className="text-sm text-forge-muted/80 mb-3">{c.description}</p>
            <div className="grid grid-cols-5 gap-1 mb-2">
              <ScoreBar label="Demand" value={c.scores.demandScore} weight="30%" />
              <ScoreBar label="Simple" value={c.scores.buildSimplicity} weight="20%" />
              <ScoreBar label="Money" value={c.scores.monetizationFit} weight="25%" />
              <ScoreBar label="Deploy" value={c.scores.deploymentReadiness} weight="15%" />
              <ScoreBar label="Unique" value={c.scores.differentiationScore} weight="10%" />
            </div>
            <div className="flex items-center justify-between text-xs text-forge-muted">
              <span>💰 ${c.recommendedPrice}/mo</span>
              <span>⏱ {c.estimatedTimeToLaunch}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScoreBar({ label, value, weight }: { label: string; value: number; weight: string }) {
  return (
    <div className="text-center">
      <div className="h-12 bg-forge-bg rounded flex items-end justify-center mb-1">
        <div
          className="w-full bg-forge-cyan/30 rounded-t"
          style={{ height: `${value}%` }}
        />
      </div>
      <p className="text-[9px] text-forge-muted">{label}</p>
      <p className="text-[8px] text-forge-muted/50">{weight}</p>
    </div>
  );
}
