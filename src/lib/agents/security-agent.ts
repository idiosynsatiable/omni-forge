import type { AgentProposalOutput } from "./orchestrator";

export function runSecurityAgent(app: {
  name: string;
  description: string;
  category: string;
  priceMonthly: number;
  status: string;
}): AgentProposalOutput {
  const actions = [
    "Enforce env-only secret management — no hardcoded keys in source",
    "Add Zod input validation on all user-facing endpoints",
    "Implement rate limiting (20 req/min for mutations, 100 req/min for reads)",
    "Add CORS configuration with strict origin whitelist",
    "Use parameterized queries via Prisma ORM — no raw SQL",
    "Add Content-Security-Policy headers",
    "Validate and sanitize all file paths to prevent traversal",
    "Scan generated output for blocked phrases and hardcoded secrets",
  ];

  const risks: string[] = [];

  if (app.category === "ai-utility" || app.category === "ai-tool") {
    risks.push("AI provider API keys must be rotated regularly");
    actions.push("Implement API key rotation policy and expiry alerts");
  }

  if (app.priceMonthly > 0) {
    risks.push("Billing endpoints are high-value targets for abuse");
    actions.push("Add webhook signature verification for Stripe events");
    actions.push("Log all billing-related actions for audit trail");
  }

  return {
    agentName: "Security Agent",
    proposalType: "security-audit",
    confidence: 0.90,
    summary: `Security audit for ${app.name}: ${actions.length} security measures recommended, ${risks.length} specific risks identified.`,
    recommendedActions: actions,
    risks: risks.length > 0 ? risks : ["Standard web application security risks"],
    validationRequirements: [
      "No hardcoded secrets in any generated file",
      "All user inputs validated with Zod schemas",
      "Rate limiting active on mutation endpoints",
      "TemplateForge validation gate must pass",
    ],
  };
}
