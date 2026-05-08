export const dynamic = "force-dynamic";
// ============================================================================
// Revenue Spine Billing Profile API Route — Omni-Forge Phase 3.5
// POST /api/revenue-spine/billing-profile
// Creates a billing profile in cash-saas-core-v2 for a generated app.
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getCashSaasClient } from "@/lib/revenue-spine/cashSaasClient";
import { CreateBillingProfileRequestSchema } from "@/lib/revenue-spine/revenueSpineTypes";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CreateBillingProfileRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const client = getCashSaasClient();

    if (!client.isEnabled) {
      return NextResponse.json(
        {
          error: "Revenue spine disabled",
          message: "CASH_SAAS_CORE_URL and CASH_SAAS_ADMIN_API_KEY must be configured",
          safe: true,
        },
        { status: 503 },
      );
    }

    const result = await client.createBillingProfile(parsed.data);

    if (result.success && result.data) {
      return NextResponse.json({
        success: true,
        billing_profile: result.data,
        timestamp: new Date().toISOString(),
      });
    }

    const errorMsg = result.enabled === false ? result.reason : (result as any).error;
    return NextResponse.json(
      { error: "Billing profile creation failed", details: errorMsg },
      { status: 502 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal error", details: message },
      { status: 500 },
    );
  }
}
