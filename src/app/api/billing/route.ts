export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getStripeStatus } from "@/lib/billing/stripe";
import { PLATFORM_TIERS } from "@/lib/billing/pricing";

export async function GET() {
  const status = getStripeStatus();

  return NextResponse.json({
    billing: status,
    platformTiers: PLATFORM_TIERS,
    strongestFeature: "Generate a monetized app with billing, deployment config, docs, and validation in one run.",
  });
}
