import type { AgentProposalOutput } from "./orchestrator";

export function runQaAgent(app: {
  name: string;
  description: string;
  category: string;
  priceMonthly: number;
  status: string;
}): AgentProposalOutput {
  const checks = [
    "Verify package.json has valid name, version, and scripts",
    "Verify server.ts compiles without TypeScript errors",
    "Verify /health endpoint returns JSON with status field",
    "Verify /run endpoint accepts input and returns structured output",
    "Verify .env.example lists all required environment variables",
    "Verify README.md includes install, setup, and usage instructions",
    "Verify Dockerfile builds successfully",
    "Verify no blocked phrases exist in generated source files",
    "Verify no hardcoded secrets exist in generated source files",
    "Verify all imports resolve to valid modules",
  ];

  const actions = [
    "Run TemplateForge placeholder scanner on all generated files",
    "Run TemplateForge weak language scanner on all generated files",
    "Calculate Artifact Integrity Score",
    "Verify deployment readiness checklist",
    "Validate billing profile configuration",
    "Check all API endpoints return valid JSON responses",
  ];

  const risks: string[] = [];

  if (app.status === "draft") {
    risks.push("QA cannot fully validate draft apps — generation must complete first");
  }

  return {
    agentName: "QA Agent",
    proposalType: "quality-check",
    confidence: app.status === "generated" || app.status === "validated" ? 0.92 : 0.55,
    summary: `QA plan for ${app.name}: ${checks.length} automated checks, ${actions.length} validation actions. Status: ${app.status}.`,
    recommendedActions: actions,
    risks: risks.length > 0 ? risks : ["Standard quality assurance risks"],
    validationRequirements: [
      "Artifact Integrity Score must be >= 85 (Strong)",
      "Zero critical validation issues",
      "All deployment readiness checks passing",
      "README must be complete and accurate",
    ],
  };
}
