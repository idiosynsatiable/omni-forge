export const dynamic = "force-dynamic";
// ============================================================================
// Revenue Spine Sync API Route — Omni-Forge Phase 3.5
// POST /api/revenue-spine/sync
// Syncs a generated app with cash-saas-core-v2 (register, billing, product).
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { syncGeneratedApp } from "@/lib/revenue-spine/generatedAppSync";
import { recordSyncResult } from "@/lib/revenue-spine/revenueSpineHealth";
import { MonetizationMode } from "@/lib/revenue-spine/revenueSpineTypes";
import { z } from "zod";

const SyncRequestSchema = z.object({
  appName: z.string().min(1).max(255),
  appSlug: z.string().regex(/^[a-z0-9-]+$/).max(100),
  appId: z.string().uuid().optional().default("00000000-0000-0000-0000-000000000000"),
  description: z.string().max(2000).optional(),
  monetizationMode: MonetizationMode,
  features: z.array(z.string()).default([]),
  hasAuth: z.boolean().default(false),
  hasDashboard: z.boolean().default(false),
  hasApi: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = SyncRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const result = await syncGeneratedApp(parsed.data);
    recordSyncResult(result.success);

    return NextResponse.json({
      success: result.success,
      result,
      timestamp: new Date().toISOString(),
    }, { status: result.success ? 200 : 502 });
  } catch (error) {
    recordSyncResult(false);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Sync failed", details: message },
      { status: 500 },
    );
  }
}
