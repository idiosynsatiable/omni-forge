export interface RankedApp {
  id: string;
  name: string;
  estimatedMrr: number;
  revenueProbabilityScore: number;
  launchPriorityScore: number;
  rank: number;
  tier: string;
  underMonetized: boolean;
}

export function rankAppsByRevenue(
  apps: Array<{
    id: string;
    name: string;
    estimatedMrr: number;
    priceMonthly: number;
    revenueProbabilityScore: number;
    launchPriorityScore: number;
    status: string;
  }>
): RankedApp[] {
  const scored = apps.map((app) => {
    const isUnderMonetized =
      app.priceMonthly < 10 &&
      app.status === "generated" &&
      app.revenueProbabilityScore > 50;

    return {
      id: app.id,
      name: app.name,
      estimatedMrr: app.estimatedMrr,
      revenueProbabilityScore: app.revenueProbabilityScore,
      launchPriorityScore: app.launchPriorityScore,
      rank: 0,
      tier: getTier(app.estimatedMrr),
      underMonetized: isUnderMonetized,
    };
  });

  scored.sort((a, b) => {
    const scoreA = a.estimatedMrr * 0.5 + a.launchPriorityScore * 0.3 + a.revenueProbabilityScore * 0.2;
    const scoreB = b.estimatedMrr * 0.5 + b.launchPriorityScore * 0.3 + b.revenueProbabilityScore * 0.2;
    return scoreB - scoreA;
  });

  return scored.map((app, i) => ({ ...app, rank: i + 1 }));
}

function getTier(mrr: number): string {
  if (mrr >= 500) return "platinum";
  if (mrr >= 200) return "gold";
  if (mrr >= 50) return "silver";
  if (mrr > 0) return "bronze";
  return "none";
}
