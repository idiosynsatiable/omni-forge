"use client";

interface Props {
  score: number;
  size?: "sm" | "md";
}

export default function ArtifactIntegrityBadge({ score, size = "md" }: Props) {
  let label: string;
  let color: string;

  if (score >= 95) {
    label = "Pristine";
    color = "text-forge-emerald bg-forge-emerald/10 border-forge-emerald/20";
  } else if (score >= 85) {
    label = "Strong";
    color = "text-forge-cyan bg-forge-cyan/10 border-forge-cyan/20";
  } else if (score >= 70) {
    label = "Acceptable";
    color = "text-forge-amber bg-forge-amber/10 border-forge-amber/20";
  } else if (score >= 50) {
    label = "Risky";
    color = "text-orange-400 bg-orange-400/10 border-orange-400/20";
  } else {
    label = "Rejected";
    color = "text-forge-red bg-forge-red/10 border-forge-red/20";
  }

  if (size === "sm") {
    return (
      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-medium ${color}`}>
        {score} {label}
      </span>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${color}`}>
      <span className="text-sm font-bold">{score}</span>
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
}
