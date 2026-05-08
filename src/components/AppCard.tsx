"use client";

import Link from "next/link";
import HealthBadge from "./HealthBadge";
import ArtifactIntegrityBadge from "./ArtifactIntegrityBadge";

interface AppCardProps {
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
  estimatedMrr: number;
  priceMonthly: number;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-forge-muted/20 text-forge-muted",
  planning: "bg-forge-blue/20 text-forge-blue",
  generating: "bg-forge-amber/20 text-forge-amber",
  generated: "bg-forge-cyan/20 text-forge-cyan",
  validating: "bg-forge-violet/20 text-forge-violet",
  validated: "bg-forge-emerald/20 text-forge-emerald",
  deploying: "bg-forge-amber/20 text-forge-amber",
  deployed: "bg-green-500/20 text-green-400",
  failed: "bg-forge-red/20 text-forge-red",
};

export default function AppCard(props: AppCardProps) {
  return (
    <Link href={`/apps/${props.id}`}>
      <div className="bg-forge-surface border border-forge-border rounded-xl p-5 hover:border-forge-cyan/30 transition-all group cursor-pointer">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-forge-text group-hover:text-forge-cyan transition-colors">
              {props.name}
            </h3>
            <span className="text-xs text-forge-muted">{props.slug} · :{props.port}</span>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[props.status] || STATUS_COLORS.draft}`}>
            {props.status}
          </span>
        </div>
        <p className="text-sm text-forge-muted mb-4 line-clamp-2">{props.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HealthBadge score={props.healthScore} size="sm" />
            <ArtifactIntegrityBadge score={props.artifactIntegrityScore} size="sm" />
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-forge-emerald">${props.estimatedMrr}/mo</p>
            <p className="text-xs text-forge-muted">{props.category}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
