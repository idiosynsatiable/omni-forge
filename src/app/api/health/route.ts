export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getSystemHealth } from "@/lib/health";

const SERVICE_VERSION = "3.0.0";

function gitSha(): string {
  const sha =
    process.env.RAILWAY_GIT_COMMIT_SHA ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.GIT_COMMIT_SHA ||
    "unknown";
  return sha.slice(0, 12);
}

function repo(): string {
  const owner = process.env.RAILWAY_GIT_REPO_OWNER || process.env.VERCEL_GIT_REPO_OWNER;
  const name = process.env.RAILWAY_GIT_REPO_NAME || process.env.VERCEL_GIT_REPO_SLUG;
  if (owner && name) return `${owner}/${name}`;
  return process.env.SERVICE_REPO || "idiosynsatiable/omni-forge";
}

function mode(): string {
  if (process.env.VERCEL) return "vercel-serverless";
  if (process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID) return "railway";
  return "server";
}

export async function GET() {
  const report = await getSystemHealth();
  // Provenance/identity fields — same schema used by aether-swarm so heartbeat
  // can compare git sha drift between Vercel and Railway deployments.
  return NextResponse.json({
    ...report,
    version: SERVICE_VERSION,
    gitSha: gitSha(),
    repo: repo(),
    mode: mode(),
  });
}
