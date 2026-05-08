export const dynamic = "force-dynamic";
// ============================================================================
// Revenue Spine API Product Route — Omni-Forge Phase 3.5
// POST /api/revenue-spine/api-product
// Creates an API product in cash-saas-core-v2 for a generated app.
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getCashSaasClient } from "@/lib/revenue-spine/cashSaasClient";
import { CreateApiProductRequestSchema } from "@/lib/revenue-spine/revenueSpineTypes";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CreateApiProductRequestSchema.safeParse(body);

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

    const result = await client.createApiProduct(parsed.data);

    if (result.success && result.data) {
      return NextResponse.json({
        success: true,
        api_product: result.data,
        timestamp: new Date().toISOString(),
      });
    }

    const errorMsg = result.enabled === false ? result.reason : (result as any).error;
    return NextResponse.json(
      { error: "API product creation failed", details: errorMsg },
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
