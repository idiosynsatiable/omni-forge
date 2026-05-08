import { PrismaClient } from "@prisma/client";

/**
 * Lazy Prisma client.
 *
 * Behavior changes (vs. prior version that used `execSync("npx prisma db push")`
 * at module-load):
 *  - No subprocess invocation.  npx is not reliably present in Vercel's
 *    serverless lambda runtime, and running `prisma db push` on every cold
 *    start would be unsafe even if it were.
 *  - The PrismaClient is constructed lazily (on first access) so a missing
 *    DATABASE_URL does not crash the entire route handler at import time.
 *  - `dbAvailable()` lets callers (e.g. health checks, dashboards) report
 *    a graceful "degraded" state instead of returning a 500 to the user.
 */

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

let _client: PrismaClient | null = null;
let _initError: Error | null = null;

function buildClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export function getPrisma(): PrismaClient {
  if (_client) return _client;
  if (globalForPrisma.prisma) {
    _client = globalForPrisma.prisma;
    return _client;
  }
  try {
    _client = buildClient();
  } catch (err) {
    _initError = err as Error;
    throw err;
  }
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = _client;
  }
  return _client;
}

/**
 * Best-effort connectivity probe.  Returns `{ ok, reason? }`.
 * Never throws.  Use in health checks or graceful-degradation paths.
 */
export async function dbAvailable(): Promise<{ ok: boolean; reason?: string }> {
  if (!process.env.DATABASE_URL) {
    return { ok: false, reason: "DATABASE_URL is not configured" };
  }
  try {
    const p = getPrisma();
    // Cheap probe — sqlite & postgres both support `SELECT 1`.
    await p.$queryRawUnsafe("SELECT 1");
    return { ok: true };
  } catch (err) {
    const msg = (err as Error)?.message?.split("\n")[0]?.slice(0, 200) ?? "unknown error";
    return { ok: false, reason: msg };
  }
}

// Lazy proxy so existing `import prisma from "./db"; prisma.app.findMany()`
// callers keep working.  Errors only surface on actual DB access.
const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrisma();
    // @ts-expect-error — dynamic delegation
    const value = client[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
}) as PrismaClient;

export { prisma, _initError };
export default prisma;
