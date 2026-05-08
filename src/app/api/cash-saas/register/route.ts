export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { registerApp, getBillingProfile, getCashSaasStatus } from "@/lib/cash-saas";
import { structuredError } from "@/lib/security";
import { z } from "zod";

const registerSchema = z.object({
  organizationId: z.number().int().positive(),
  appName: z.string().min(2).max(160),
  appSlug: z.string().min(2).max(180),
  revenueMode: z.string().optional().default("subscription_plus_usage"),
  freeQuota: z.number().int().optional().default(100),
  paidPlan: z.string().optional().default("starter"),
  usageUnit: z.string().optional().default("api_call"),
  usagePriceCents: z.number().int().optional().default(5),
});

export async function POST(request: Request) {
  const status = await getCashSaasStatus();
  if (!status.connected) {
    return NextResponse.json(
      structuredError(503, "Cash SaaS backend is not connected", { error: status.error }),
      { status: 503 }
    );
  }

  const body = await request.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      structuredError(400, "Validation failed", parsed.error.errors),
      { status: 400 }
    );
  }

  const registered = await registerApp(parsed.data);
  if (!registered) {
    return NextResponse.json(
      structuredError(502, "Failed to register app with cash-saas-core-v2"),
      { status: 502 }
    );
  }

  const billingProfile = await getBillingProfile({
    appName: parsed.data.appName,
    appSlug: parsed.data.appSlug,
    revenueMode: parsed.data.revenueMode,
    usageUnit: parsed.data.usageUnit,
    usagePriceCents: parsed.data.usagePriceCents,
  });

  return NextResponse.json({
    registered,
    billingProfile,
    message: `App "${parsed.data.appName}" registered with cash-saas-core-v2 monetization backend.`,
  });
}
