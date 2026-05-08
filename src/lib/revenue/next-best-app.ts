export interface NextBestAppCandidate {
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

const APP_IDEAS: Array<{
  name: string;
  description: string;
  category: string;
  demand: number;
  simplicity: number;
  monetization: number;
  deployment: number;
  differentiation: number;
  price: number;
  timeToLaunch: string;
}> = [
  {
    name: "Invoice Generator Pro",
    description: "AI-powered invoice creation with payment tracking, client management, and recurring billing templates.",
    category: "automation-tool",
    demand: 85,
    simplicity: 75,
    monetization: 90,
    deployment: 85,
    differentiation: 60,
    price: 29,
    timeToLaunch: "2-3 days",
  },
  {
    name: "Social Proof Widget",
    description: "Embeddable notification widget showing recent signups, purchases, and reviews to boost conversion rates.",
    category: "creator-tool",
    demand: 80,
    simplicity: 90,
    monetization: 85,
    deployment: 90,
    differentiation: 55,
    price: 19,
    timeToLaunch: "1-2 days",
  },
  {
    name: "API Rate Monitor",
    description: "Real-time API usage monitoring with alerts, rate limit tracking, and cost estimation dashboard.",
    category: "analytics-tool",
    demand: 75,
    simplicity: 70,
    monetization: 80,
    deployment: 85,
    differentiation: 65,
    price: 39,
    timeToLaunch: "3-4 days",
  },
  {
    name: "Content Brief Machine",
    description: "Generate SEO-optimized content briefs with keyword clusters, competitor analysis, and outline suggestions.",
    category: "seo-tool",
    demand: 88,
    simplicity: 65,
    monetization: 85,
    deployment: 80,
    differentiation: 70,
    price: 39,
    timeToLaunch: "3-5 days",
  },
  {
    name: "Waitlist Launch Page",
    description: "Instant waitlist landing page generator with email capture, referral tracking, and launch countdown.",
    category: "creator-tool",
    demand: 82,
    simplicity: 95,
    monetization: 70,
    deployment: 95,
    differentiation: 45,
    price: 14,
    timeToLaunch: "1 day",
  },
  {
    name: "Stripe Revenue Dashboard",
    description: "Connect Stripe account and view MRR, churn, LTV, and cohort analysis in a clean dashboard.",
    category: "analytics-tool",
    demand: 78,
    simplicity: 55,
    monetization: 75,
    deployment: 70,
    differentiation: 60,
    price: 29,
    timeToLaunch: "4-6 days",
  },
  {
    name: "Proposal Generator",
    description: "AI-powered business proposal generator with templates, pricing tables, and PDF export.",
    category: "automation-tool",
    demand: 72,
    simplicity: 70,
    monetization: 80,
    deployment: 85,
    differentiation: 65,
    price: 29,
    timeToLaunch: "3-4 days",
  },
  {
    name: "Micro-CRM for Freelancers",
    description: "Lightweight client relationship manager with deal tracking, notes, follow-up reminders, and invoicing.",
    category: "automation-tool",
    demand: 80,
    simplicity: 60,
    monetization: 85,
    deployment: 75,
    differentiation: 55,
    price: 19,
    timeToLaunch: "4-6 days",
  },
];

export function scoreCandidate(idea: typeof APP_IDEAS[0]): NextBestAppCandidate {
  const totalScore =
    idea.demand * 0.30 +
    idea.simplicity * 0.20 +
    idea.monetization * 0.25 +
    idea.deployment * 0.15 +
    idea.differentiation * 0.10;

  return {
    name: idea.name,
    description: idea.description,
    category: idea.category,
    scores: {
      demandScore: idea.demand,
      buildSimplicity: idea.simplicity,
      monetizationFit: idea.monetization,
      deploymentReadiness: idea.deployment,
      differentiationScore: idea.differentiation,
    },
    totalScore: Math.round(totalScore * 100) / 100,
    recommendedPrice: idea.price,
    estimatedTimeToLaunch: idea.timeToLaunch,
  };
}

export function getNextBestApps(
  existingSlugs: string[],
  limit: number = 5
): NextBestAppCandidate[] {
  const candidates = APP_IDEAS
    .filter(
      (idea) =>
        !existingSlugs.includes(
          idea.name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
        )
    )
    .map(scoreCandidate)
    .sort((a, b) => b.totalScore - a.totalScore);

  return candidates.slice(0, limit);
}
