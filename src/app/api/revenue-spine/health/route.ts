export const dynamic = "force-dynamic";
// ============================================================================
// Revenue Spine Health API Route — Omni-Forge Phase 3.5
// GET /api/revenue-spine/health
// Returns the current health status of the revenue spine connection.
// ============================================================================

import { NextResponse } from "next/server";
import { checkRevenueSpineHealth } from "@/lib/revenue-spine/revenueSpineHealth";

export async function GET() {
  try {
    const health = await checkRevenueSpineHealth();

    return NextResponse.json({
      status: health.enabled && health.platform_reachable ? "healthy" : health.enabled ? "degraded" : "disabled",
      health,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        status: "error",
        error: message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
