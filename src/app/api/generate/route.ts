export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import {
  generateApp,
  GenerationConflictError,
  GenerationInProgressError,
} from "@/lib/app-factory";
import { requireOrganization } from "@/lib/auth/unified-auth";
import { generateAppSchema } from "@/lib/validators";
import { checkRateLimit, structuredError } from "@/lib/security";

const MAX_BODY_BYTES = 64 * 1024;
const MUTATING_ROLES = ["owner", "admin", "developer"] as const;

function authError(message: string, status: number) {
  return NextResponse.json(structuredError(status, message), { status });
}

export async function POST(request: NextRequest) {
  const auth = await requireOrganization(request, MUTATING_ROLES);
  if (!auth.authenticated || !auth.user || !auth.organization || !auth.token) {
    return authError(auth.error || "Unauthorized", auth.status);
  }

  const idempotencyKey = request.headers.get("idempotency-key")?.trim() || "";
  if (
    idempotencyKey.length < 8 ||
    idempotencyKey.length > 200 ||
    !/^[A-Za-z0-9._:-]+$/.test(idempotencyKey)
  ) {
    return authError(
      "A valid Idempotency-Key header is required for generation",
      400
    );
  }

  const rl = checkRateLimit(
    `generate:${auth.organization.id}:${auth.user.id}`,
    10,
    60_000
  );
  if (!rl.allowed) {
    const response = NextResponse.json(
      structuredError(429, "Rate limit exceeded"),
      { status: 429 }
    );
    response.headers.set(
      "Retry-After",
      String(Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000)))
    );
    return response;
  }

  let text: string;
  try {
    text = await request.text();
  } catch {
    return authError("Request body could not be read", 400);
  }

  if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) {
    return authError("Request body exceeds 64 KiB", 413);
  }

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return authError("Request body must be valid JSON", 400);
  }

  const parsed = generateAppSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      structuredError(400, "Validation failed", parsed.error.errors),
      { status: 400 }
    );
  }

  try {
    const result = await generateApp(parsed.data, {
      organizationId: auth.organization.id,
      userId: auth.user.id,
      accessToken: auth.token,
      idempotencyKey,
    });

    return NextResponse.json({
      app: result.app,
      replayed: result.replayed,
      directory: result.directory,
      files: result.files,
      plan: result.plan,
      billingProfile: result.billingProfile,
      validationReport: {
        score: result.validationReport.artifactScore.score,
        label: result.validationReport.artifactScore.label,
        passed: result.validationReport.passed,
        issues: result.validationReport.issues.length,
      },
      revenueForecast: {
        mrr: result.revenueForecast.mrr,
        annualRevenue: result.revenueForecast.annualRevenue,
        payingCustomers: result.revenueForecast.payingCustomers,
      },
      cashSaas: result.cashSaas,
    });
  } catch (error) {
    if (error instanceof GenerationConflictError) {
      return authError(error.message, 409);
    }
    if (error instanceof GenerationInProgressError) {
      const response = authError(error.message, 409);
      response.headers.set("Retry-After", "5");
      return response;
    }
    console.error("Generation failed", {
      organizationId: auth.organization.id,
      userId: auth.user.id,
      error: error instanceof Error ? error.name : "UnknownError",
    });
    return authError("Generation failed; the attempt was preserved for safe retry", 500);
  }
}
