"use client";

interface Props {
  score: number;
  size?: "sm" | "md";
}

export default function HealthBadge({ score, size = "md" }: Props) {
  let signal: string;
  let color: string;

  if (score >= 80) {
    signal = "Healthy";
    color = "text-forge-emerald bg-forge-emerald/10 border-forge-emerald/20";
  } else if (score >= 50) {
    signal = "Degraded";
    color = "text-forge-amber bg-forge-amber/10 border-forge-amber/20";
  } else {
    signal = "Failing";
    color = "text-forge-red bg-forge-red/10 border-forge-red/20";
  }

  if (size === "sm") {
    return (
      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-medium ${color}`}>
        {score} {signal}
      </span>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${color}`}>
      <span className="text-sm font-bold">{score}</span>
      <span className="text-xs font-medium">{signal}</span>
    </div>
  );
}
