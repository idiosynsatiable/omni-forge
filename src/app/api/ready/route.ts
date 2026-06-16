/**
 * Readiness probe — strict 200/503, mirrors CCP's /api/ready contract.
 *
 *   /api/health  → informational rollup (may be 200 even when degraded)
 *   /api/ready   → 200 ONLY when this instance can serve traffic safely.
 *
 * Used by CCP's lib/ecosystem.ts probe to gate routing decisions and by
 * Railway healthchecks for deploy-promotion gates.
 */
import { NextResponse } from "next/server";
import { getPrisma, dbAvailable } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface ReadyPayload {
  ready: boolean;
  service: "omni-forge";
  checks: {
    database: { ok: boolean; latencyMs?: number; message?: string };
    schema:   { ok: boolean; message?: string };
  };
  timestamp: string;
}

const TIMEOUT_MS = 3000;
function withTimeout<T>(p: Promise<T>, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label}_timeout_${TIMEOUT_MS}ms`)), TIMEOUT_MS),
    ),
  ]);
}

export async function GET() {
  const checks: ReadyPayload["checks"] = {
    database: { ok: false },
    schema:   { ok: false },
  };

  // 1. DB connectivity — uses the existing dbAvailable() helper which never throws.
  const dbStart = Date.now();
  try {
    const probe = await withTimeout(dbAvailable(), "db");
    checks.database = probe.ok
      ? { ok: true, latencyMs: Date.now() - dbStart }
      : { ok: false, latencyMs: Date.now() - dbStart, message: (probe.reason || "unknown").slice(0, 120) };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    checks.database = { ok: false, latencyMs: Date.now() - dbStart, message: msg.slice(0, 120) };
  }

  // 2. Schema presence — verify the canonical App table is queryable.
  //    Catches "DB up but migrations not deployed" and "client/schema drift".
  if (checks.database.ok) {
    try {
      const p = getPrisma();
      await withTimeout(p.app.findFirst({ select: { id: true } }), "schema");
      checks.schema = { ok: true };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      checks.schema = { ok: false, message: msg.slice(0, 120) };
    }
  } else {
    checks.schema = { ok: false, message: "skipped — database not ready" };
  }

  const ready = checks.database.ok && checks.schema.ok;
  const payload: ReadyPayload = {
    ready,
    service: "omni-forge",
    checks,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(payload, { status: ready ? 200 : 503 });
}
