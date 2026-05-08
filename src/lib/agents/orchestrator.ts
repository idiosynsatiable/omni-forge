import prisma from "../db";
import { runProductAgent } from "./product-agent";
import { runBuildAgent } from "./build-agent";
import { runPricingAgent } from "./pricing-agent";
import { runSecurityAgent } from "./security-agent";
import { runQaAgent } from "./qa-agent";
import { runLaunchAgent } from "./launch-agent";
import { runGrowthAgent } from "./growth-agent";

export interface AgentProposalOutput {
  agentName: string;
  proposalType: string;
  confidence: number;
  summary: string;
  recommendedActions: string[];
  risks: string[];
  validationRequirements: string[];
}

export interface OrchestratorResult {
  appId: string;
  accepted: AgentProposalOutput[];
  rejected: AgentProposalOutput[];
  totalProposals: number;
  acceptedCount: number;
  rejectedCount: number;
  commitLog: string[];
}

const AGENT_MAP: Record<
  string,
  (app: { name: string; description: string; category: string; priceMonthly: number; status: string }) => AgentProposalOutput
> = {
  product: runProductAgent,
  build: runBuildAgent,
  pricing: runPricingAgent,
  security: runSecurityAgent,
  qa: runQaAgent,
  launch: runLaunchAgent,
  growth: runGrowthAgent,
};

const CONFIDENCE_THRESHOLD = 0.5;

export async function runOrchestrator(
  appId: string,
  agentNames: string[] = ["product", "build", "pricing", "security", "qa", "launch", "growth"]
): Promise<OrchestratorResult> {
  const app = await prisma.app.findUnique({ where: { id: appId } });
  if (!app) throw new Error(`App ${appId} not found`);

  const accepted: AgentProposalOutput[] = [];
  const rejected: AgentProposalOutput[] = [];
  const commitLog: string[] = [];

  for (const agentName of agentNames) {
    const agentFn = AGENT_MAP[agentName];
    if (!agentFn) {
      commitLog.push(`[SKIP] Unknown agent: ${agentName}`);
      continue;
    }

    const proposal = agentFn({
      name: app.name,
      description: app.description,
      category: app.category,
      priceMonthly: app.priceMonthly,
      status: app.status,
    });

    if (proposal.confidence >= CONFIDENCE_THRESHOLD) {
      accepted.push(proposal);
      commitLog.push(
        `[ACCEPT] ${proposal.agentName}: ${proposal.summary} (confidence: ${proposal.confidence})`
      );

      await prisma.agentProposal.create({
        data: {
          appId,
          agentName: proposal.agentName,
          proposalType: proposal.proposalType,
          confidence: proposal.confidence,
          summary: proposal.summary,
          recommendedActionsJson: JSON.stringify(proposal.recommendedActions),
          risksJson: JSON.stringify(proposal.risks),
          status: "accepted",
        },
      });
    } else {
      rejected.push(proposal);
      commitLog.push(
        `[REJECT] ${proposal.agentName}: Confidence too low (${proposal.confidence} < ${CONFIDENCE_THRESHOLD})`
      );

      await prisma.agentProposal.create({
        data: {
          appId,
          agentName: proposal.agentName,
          proposalType: proposal.proposalType,
          confidence: proposal.confidence,
          summary: proposal.summary,
          recommendedActionsJson: JSON.stringify(proposal.recommendedActions),
          risksJson: JSON.stringify(proposal.risks),
          status: "rejected",
        },
      });
    }
  }

  return {
    appId,
    accepted,
    rejected,
    totalProposals: accepted.length + rejected.length,
    acceptedCount: accepted.length,
    rejectedCount: rejected.length,
    commitLog,
  };
}
