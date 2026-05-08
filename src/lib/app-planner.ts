export interface AppPlan {
  name: string;
  slug: string;
  tagline: string;
  features: string[];
  techStack: string[];
  endpoints: string[];
  monetization: string;
  launchCopy: string;
  riskAssessment: string[];
}

export function planApp(input: {
  name: string;
  slug: string;
  description: string;
  category: string;
  revenueMode: string;
  priceMonthly: number;
}): AppPlan {
  const categoryFeatures: Record<string, string[]> = {
    "ai-utility": ["AI-powered analysis engine", "Structured JSON output", "Usage tracking", "API key management"],
    "ai-tool": ["AI-powered analysis engine", "Structured JSON output", "Usage tracking", "API key management"],
    "seo-tool": ["Keyword analysis engine", "Content optimization", "SERP tracking", "Competitor analysis"],
    "creator-tool": ["Content generation", "Template library", "Export options", "Collaboration"],
    "automation-tool": ["Workflow automation", "Trigger system", "Integration hooks", "Scheduling"],
    "analytics-tool": ["Data visualization", "Custom dashboards", "Report generation", "Data export"],
    "content-engine": ["Content pipeline", "SEO optimization", "Multi-format output", "Distribution"],
    "paid-api": ["API endpoints", "Authentication", "Rate limiting", "Usage metering"],
    "internal-dashboard": ["Real-time monitoring", "Custom widgets", "Alert system", "Data filters"],
    "resume-career-tool": ["Resume analysis", "Skill matching", "Template library", "PDF export"],
  };

  const features = categoryFeatures[input.category] || [
    "Core functionality",
    "User dashboard",
    "API access",
    "Data export",
  ];

  const techStack = [
    "Express.js + TypeScript",
    "Zod validation",
    "Structured JSON responses",
    "Health monitoring endpoint",
    "CORS enabled",
  ];

  const endpoints = [
    "GET /health — System health check",
    "POST /run — Core functionality endpoint",
    "GET /manifest — App metadata",
  ];

  if (input.revenueMode !== "free") {
    endpoints.push("POST /api/checkout — Stripe checkout session");
    endpoints.push("POST /api/webhooks/stripe — Stripe webhook handler");
    techStack.push("Stripe billing integration");
  }

  const risks: string[] = [];
  if (input.priceMonthly === 0) risks.push("No revenue model defined");
  if (input.category === "ai-utility" || input.category === "ai-tool") {
    risks.push("AI API costs may impact margins");
  }

  return {
    name: input.name,
    slug: input.slug,
    tagline: `${input.name} — ${input.description.slice(0, 80)}`,
    features,
    techStack,
    endpoints,
    monetization: `${input.revenueMode} at $${input.priceMonthly}/mo`,
    launchCopy: `Introducing ${input.name}: ${input.description}. Start free, upgrade to Pro for $${input.priceMonthly}/mo.`,
    riskAssessment: risks.length > 0 ? risks : ["Standard development and market risks apply"],
  };
}
