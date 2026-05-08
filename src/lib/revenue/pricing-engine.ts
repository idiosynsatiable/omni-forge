export interface PricingRecommendation {
  recommendedPrice: number;
  confidence: number;
  rationale: string;
  tiers: Array<{
    name: string;
    price: number;
    features: string[];
  }>;
  upsellPath: string;
}

const CATEGORY_PRICING: Record<string, { min: number; max: number; sweet: number }> = {
  "paid-api": { min: 9, max: 99, sweet: 29 },
  "creator-tool": { min: 14, max: 79, sweet: 29 },
  "internal-dashboard": { min: 0, max: 49, sweet: 19 },
  "ai-utility": { min: 9, max: 59, sweet: 19 },
  "ai-tool": { min: 9, max: 59, sweet: 19 },
  "seo-tool": { min: 19, max: 99, sweet: 39 },
  "resume-career-tool": { min: 9, max: 49, sweet: 19 },
  "content-engine": { min: 19, max: 79, sweet: 29 },
  "automation-tool": { min: 19, max: 99, sweet: 49 },
  "analytics-tool": { min: 14, max: 79, sweet: 29 },
};

export function recommendPricing(app: {
  category: string;
  revenueMode: string;
  priceMonthly: number;
  description: string;
}): PricingRecommendation {
  const pricing = CATEGORY_PRICING[app.category] || { min: 9, max: 59, sweet: 19 };

  const isUnderpriced = app.priceMonthly < pricing.min;
  const isOverpriced = app.priceMonthly > pricing.max;
  const isOptimal =
    app.priceMonthly >= pricing.sweet * 0.8 &&
    app.priceMonthly <= pricing.sweet * 1.3;

  let recommendedPrice = pricing.sweet;
  let confidence = 0.7;
  let rationale = "";

  if (isOptimal) {
    recommendedPrice = app.priceMonthly;
    confidence = 0.85;
    rationale = `Current price $${app.priceMonthly}/mo is within the optimal range for ${app.category} apps.`;
  } else if (isUnderpriced) {
    recommendedPrice = pricing.sweet;
    confidence = 0.75;
    rationale = `Current price $${app.priceMonthly}/mo is below market floor for ${app.category} apps. Recommend raising to $${pricing.sweet}/mo.`;
  } else if (isOverpriced) {
    recommendedPrice = pricing.sweet;
    confidence = 0.65;
    rationale = `Current price $${app.priceMonthly}/mo exceeds typical ceiling for ${app.category}. Consider lowering to $${pricing.sweet}/mo to improve conversion.`;
  } else {
    rationale = `Price $${app.priceMonthly}/mo is reasonable for ${app.category}. Sweet spot is $${pricing.sweet}/mo.`;
  }

  const proPrice = recommendedPrice;
  const agencyPrice = Math.round(recommendedPrice * 3);
  const enterprisePrice = Math.round(recommendedPrice * 10);

  return {
    recommendedPrice,
    confidence,
    rationale,
    tiers: [
      {
        name: "Free",
        price: 0,
        features: ["Basic access", "5 requests per day", "Community support"],
      },
      {
        name: "Pro",
        price: proPrice,
        features: ["Unlimited access", "API key", "Priority support", "Export data"],
      },
      {
        name: "Agency",
        price: agencyPrice,
        features: ["Multi-user", "White-label", "Custom integrations", "Dedicated support"],
      },
      {
        name: "Enterprise",
        price: enterprisePrice,
        features: ["SLA", "Custom deployment", "Audit logs", "SSO", "Dedicated infra"],
      },
    ],
    upsellPath: `Free → Pro ($${proPrice}) → Agency ($${agencyPrice}) → Enterprise ($${enterprisePrice})`,
  };
}
