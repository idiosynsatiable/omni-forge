import type { AgentProposalOutput } from "./orchestrator";

const CATEGORY_BENCHMARKS: Record<string, { avgPrice: number; range: string }> = {
  "paid-api": { avgPrice: 29, range: "$9-$99/mo" },
  "creator-tool": { avgPrice: 29, range: "$14-$79/mo" },
  "internal-dashboard": { avgPrice: 19, range: "$0-$49/mo" },
  "ai-utility": { avgPrice: 19, range: "$9-$59/mo" },
  "ai-tool": { avgPrice: 19, range: "$9-$59/mo" },
  "seo-tool": { avgPrice: 39, range: "$19-$99/mo" },
  "resume-career-tool": { avgPrice: 19, range: "$9-$49/mo" },
  "content-engine": { avgPrice: 29, range: "$19-$79/mo" },
  "automation-tool": { avgPrice: 49, range: "$19-$99/mo" },
  "analytics-tool": { avgPrice: 29, range: "$14-$79/mo" },
};

export function runPricingAgent(app: {
  name: string;
  description: string;
  category: string;
  priceMonthly: number;
  status: string;
}): AgentProposalOutput {
  const benchmark = CATEGORY_BENCHMARKS[app.category] || { avgPrice: 29, range: "$9-$59/mo" };
  const actions: string[] = [];
  const risks: string[] = [];

  const isUnderpriced = app.priceMonthly < benchmark.avgPrice * 0.5;
  const isOverpriced = app.priceMonthly > benchmark.avgPrice * 2;

  if (isUnderpriced) {
    actions.push(`Increase price from $${app.priceMonthly} to $${benchmark.avgPrice}/mo — current price is below market floor`);
    risks.push("Underpricing signals low value to potential customers");
  } else if (isOverpriced) {
    actions.push(`Consider lowering price from $${app.priceMonthly} to $${benchmark.avgPrice}/mo to improve conversion`);
    risks.push("Overpricing may limit market size significantly");
  } else {
    actions.push(`Current price $${app.priceMonthly}/mo is well-positioned for ${app.category} (avg: $${benchmark.avgPrice})`);
  }

  actions.push(`Set up 4-tier pricing: Free / Pro ($${benchmark.avgPrice}) / Agency ($${benchmark.avgPrice * 3}) / Enterprise (custom)`);
  actions.push("Add annual billing option with 20% discount");
  actions.push("Implement usage limits on free tier to drive upgrades");
  actions.push("Track conversion rate from free to paid for optimization");

  const confidence = isUnderpriced || isOverpriced ? 0.78 : 0.85;

  return {
    agentName: "Pricing Agent",
    proposalType: "pricing-strategy",
    confidence,
    summary: `Pricing analysis for ${app.name}: $${app.priceMonthly}/mo vs market avg $${benchmark.avgPrice}/mo (${benchmark.range}). ${isUnderpriced ? "UNDERPRICED" : isOverpriced ? "OVERPRICED" : "WELL-POSITIONED"}.`,
    recommendedActions: actions,
    risks: risks.length > 0 ? risks : ["Standard pricing sensitivity risks"],
    validationRequirements: [
      "Pricing tiers must cover free-to-enterprise spectrum",
      "Each tier must have clear feature differentiation",
      "Annual billing must offer meaningful discount",
    ],
  };
}
