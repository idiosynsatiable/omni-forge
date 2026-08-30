export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { listApps, createApp } from "@/lib/registry";
import { requireOrganization } from "@/lib/auth/unified-auth";
import { createAppSchema } from "@/lib/validators";
import { checkRateLimit, structuredError } from "@/lib/security";

const MUTATING_ROLES = ["owner", "admin", "developer"] as const;
const MAX_BODY_BYTES = 32 * 1024;

function authError(message: string, status: number) {
  return NextResponse.json(structuredError(status, message), { status });
}

export async function GET(request: NextRequest) {
  const auth = await requireOrganization(request);
  if (!auth.authenticated || !auth.user || !auth.organization) {
    return authError(auth.error || "Unauthorized", auth.status);
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || undefined;
  const category = searchParams.get("category") || undefined;
  const apps = await listApps(auth.organization.id, { status, category });
  return NextResponse.json({ apps, total: apps.length });
}

export async function POST(request: NextRequest) {
  const auth = await requireOrganization(request, MUTATING_ROLES);
  if (!auth.authenticated || !auth.user || !auth.organization) {
    return authError(auth.error || "Unauthorized", auth.status);
  }

  const rl = checkRateLimit(
    `apps-create:${auth.organization.id}:${auth.user.id}`,
    20,
    60_000
  );
  if (!rl.allowed) {
    const response = authError("Rate limit exceeded", 429);
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
    return authError("Request body exceeds 32 KiB", 413);
  }

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return authError("Request body must be valid JSON", 400);
  }

  const parsed = createAppSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      structuredError(400, "Validation failed", parsed.error.errors),
      { status: 400 }
    );
  }

  try {
    const app = await createApp(auth.organization.id, auth.user.id, parsed.data);
    return NextResponse.json({ app }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && /unique|slug|safe slug/i.test(error.message)) {
      return authError("An app with this name already exists in the selected organization", 409);
    }
    console.error("App create failed", {
      organizationId: auth.organization.id,
      userId: auth.user.id,
      error: error instanceof Error ? error.name : "UnknownError",
    });
    return authError("App could not be created", 500);
  }
}
