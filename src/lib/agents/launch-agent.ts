import type { AgentProposalOutput } from "./orchestrator";

export function runLaunchAgent(app: {
  name: string;
  description: string;
  category: string;
  priceMonthly: number;
  status: string;
}): AgentProposalOutput {
  const launchSteps = [
    "Finalize product positioning and tagline",
    "Generate deployment configuration (Vercel + Railway + Docker)",
    "Set up Stripe billing with checkout and webhook routes",
    "Create landing page with hero, features, pricing, and CTA",
    "Write ProductHunt launch copy",
    "Prepare social media announcement posts",
    "Set up basic SEO (meta tags, Open Graph, sitemap)",
    "Configure health monitoring and uptime alerts",
    "Run final deployment readiness check",
    "Deploy to production",
  ];

  const actions = [
    `Generate launch timeline for ${app.name}`,
    "Create landing page content with conversion-optimized copy",
    "Set up deployment configs for Vercel and Railway",
    "Configure Stripe checkout for subscription billing",
    "Draft ProductHunt and social media launch copy",
  ];

  const risks: string[] = [];

  if (app.priceMonthly === 0) {
    risks.push("No revenue model — launch may not generate income without billing setup");
    actions.push("Consider adding a paid tier before launch");
  }

  if (app.status !== "generated" && app.status !== "validated") {
    risks.push(`App status is "${app.status}" — must be generated or validated before launch`);
  }

  const confidence =
    app.status === "validated"
      ? 0.88
      : app.status === "generated"
      ? 0.75
      : 0.40;

  return {
    agentName: "Launch Agent",
    proposalType: "launch-plan",
    confidence,
    summary: `Launch plan for ${app.name}: ${launchSteps.length}-step timeline, targeting ${app.category} market at $${app.priceMonthly}/mo.`,
    recommendedActions: actions,
    risks: risks.length > 0 ? risks : ["Standard launch timing and positioning risks"],
    validationRequirements: [
      "Deployment readiness score must be 100%",
      "Billing must be configured for paid apps",
      "Landing page must have conversion-optimized copy",
      "Health monitoring must be active",
    ],
  };
}
