export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { runOrchestrator } from "@/lib/agents/orchestrator";
import { agentRunSchema } from "@/lib/validators";
import { structuredError } from "@/lib/security";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = agentRunSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      structuredError(400, "Validation failed", parsed.error.errors),
      { status: 400 }
    );
  }

  const result = await runOrchestrator(parsed.data.appId, parsed.data.agents);

  return NextResponse.json({
    appId: result.appId,
    totalProposals: result.totalProposals,
    acceptedCount: result.acceptedCount,
    rejectedCount: result.rejectedCount,
    accepted: result.accepted,
    rejected: result.rejected,
    commitLog: result.commitLog,
  });
}
