import type { AgentProposalOutput } from "./orchestrator";

export function runGrowthAgent(app: {
  name: string;
  description: string;
  category: string;
  priceMonthly: number;
  status: string;
}): AgentProposalOutput {
  const channels = [
    { name: "SEO/Content Marketing", fit: getChannelFit(app.category, "seo") },
    { name: "ProductHunt Launch", fit: getChannelFit(app.category, "producthunt") },
    { name: "Twitter/X Marketing", fit: getChannelFit(app.category, "twitter") },
    { name: "Reddit/Community", fit: getChannelFit(app.category, "reddit") },
    { name: "Email Outreach", fit: getChannelFit(app.category, "email") },
    { name: "Paid Ads (Google)", fit: getChannelFit(app.category, "paid") },
  ];

  const topChannels = channels
    .sort((a, b) => b.fit - a.fit)
    .slice(0, 3);

  const actions = [
    `Focus on top 3 growth channels: ${topChannels.map((c) => c.name).join(", ")}`,
    "Create 5 SEO-optimized blog posts targeting long-tail keywords",
    "Build email list with lead magnet (free tool/template/checklist)",
    "Set up referral program with 20% revenue share",
    "Create comparison pages vs competitors",
    `Target conversion rate: 4% free-to-paid at $${app.priceMonthly}/mo`,
  ];

  const risks: string[] = [];

  if (app.priceMonthly < 10) {
    risks.push("Low price point limits CAC budget — organic channels essential");
  }

  if (app.category === "internal-dashboard") {
    risks.push("Internal tools have limited viral growth — focus on B2B outreach");
  }

  return {
    agentName: "Growth Agent",
    proposalType: "growth-strategy",
    confidence: 0.72,
    summary: `Growth strategy for ${app.name}: Top channels are ${topChannels.map((c) => c.name).join(", ")}. Target: $${app.priceMonthly}/mo × 4% conversion.`,
    recommendedActions: actions,
    risks: risks.length > 0 ? risks : ["Standard growth execution risks"],
    validationRequirements: [
      "Growth channels must be prioritized by ROI potential",
      "CAC must be sustainable relative to LTV",
      "Content marketing requires consistent publishing cadence",
    ],
  };
}

function getChannelFit(category: string, channel: string): number {
  const matrix: Record<string, Record<string, number>> = {
    "seo-tool": { seo: 95, producthunt: 80, twitter: 70, reddit: 75, email: 60, paid: 50 },
    "ai-utility": { seo: 70, producthunt: 90, twitter: 85, reddit: 80, email: 55, paid: 45 },
    "ai-tool": { seo: 70, producthunt: 90, twitter: 85, reddit: 80, email: 55, paid: 45 },
    "creator-tool": { seo: 75, producthunt: 85, twitter: 80, reddit: 70, email: 65, paid: 55 },
    "automation-tool": { seo: 65, producthunt: 75, twitter: 60, reddit: 65, email: 80, paid: 60 },
    "analytics-tool": { seo: 70, producthunt: 70, twitter: 55, reddit: 60, email: 75, paid: 65 },
    "content-engine": { seo: 90, producthunt: 80, twitter: 75, reddit: 70, email: 60, paid: 50 },
    "internal-dashboard": { seo: 40, producthunt: 50, twitter: 35, reddit: 45, email: 70, paid: 30 },
    "paid-api": { seo: 60, producthunt: 70, twitter: 50, reddit: 65, email: 80, paid: 55 },
    "resume-career-tool": { seo: 85, producthunt: 75, twitter: 65, reddit: 80, email: 50, paid: 70 },
  };

  return matrix[category]?.[channel] || 50;
}
