import type { AgentProposalOutput } from "./orchestrator";

export function runBuildAgent(app: {
  name: string;
  description: string;
  category: string;
  priceMonthly: number;
  status: string;
}): AgentProposalOutput {
  const techStack = [
    "Express.js server with TypeScript",
    "Zod input validation",
    "Health endpoint at /health",
    "Run endpoint at /run",
    "Structured JSON responses",
    "Error handling middleware",
    "CORS configuration",
  ];

  const actions = [
    "Generate server.ts with Express + TypeScript setup",
    "Add Zod validation schemas for all inputs",
    "Implement /health endpoint returning JSON status",
    "Implement /run endpoint with core business logic",
    "Generate package.json with all dependencies",
    "Generate Dockerfile for containerized deployment",
    "Generate .env.example with all required variables",
    "Write comprehensive README.md",
  ];

  const risks: string[] = [];

  if (app.category === "ai-utility" || app.category === "ai-tool") {
    risks.push("AI features require API key management and fallback handling");
    actions.push("Add OpenAI provider with local heuristic fallback");
  }

  if (app.priceMonthly > 0) {
    actions.push("Add billing configuration and Stripe checkout route");
  }

  return {
    agentName: "Build Agent",
    proposalType: "build-plan",
    confidence: 0.88,
    summary: `Build plan for ${app.name}: ${techStack.length} tech components, ${actions.length} build tasks, containerized deployment ready.`,
    recommendedActions: actions,
    risks: risks.length > 0 ? risks : ["Standard build complexity risks"],
    validationRequirements: [
      "All generated files must pass TemplateForge validation",
      "Server must start without errors",
      "Health endpoint must return valid JSON",
      "No placeholder strings in generated code",
    ],
  };
}
