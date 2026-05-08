import type { AgentProposalOutput } from "./orchestrator";

export function runProductAgent(app: {
  name: string;
  description: string;
  category: string;
  priceMonthly: number;
  status: string;
}): AgentProposalOutput {
  const features = [
    "User authentication and onboarding flow",
    "Core value-delivery engine",
    "Dashboard with usage analytics",
    "Settings and profile management",
    "API endpoint for integrations",
  ];

  const risks: string[] = [];
  const actions: string[] = [];

  if (app.description.length < 50) {
    risks.push("Short description may lead to vague product scope");
    actions.push("Expand product description to at least 100 characters with specific use cases");
  }

  if (app.status === "draft") {
    actions.push("Move from draft to planning phase");
    actions.push("Define target user persona and primary job-to-be-done");
  }

  actions.push(`Build core feature set: ${features.slice(0, 3).join(", ")}`);
  actions.push("Define success metrics (DAU, activation rate, feature usage)");
  actions.push("Create user onboarding flow with first-value-in-5-minutes goal");

  const confidence = app.description.length > 50 ? 0.82 : 0.65;

  return {
    agentName: "Product Agent",
    proposalType: "product-plan",
    confidence,
    summary: `Product plan for ${app.name}: ${features.length} core features identified, targeting ${app.category} market segment.`,
    recommendedActions: actions,
    risks: risks.length > 0 ? risks : ["Standard product development risks apply"],
    validationRequirements: [
      "Feature list must be validated against target persona",
      "Onboarding flow must deliver value within 5 minutes",
      "Success metrics must be measurable and time-bound",
    ],
  };
}
