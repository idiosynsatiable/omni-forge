export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getApp, updateApp, deleteApp } from "@/lib/registry";
import { requireOrganization } from "@/lib/auth/unified-auth";
import { updateAppSchema } from "@/lib/validators";
import { structuredError } from "@/lib/security";

const MUTATING_ROLES = ["owner", "admin", "developer"] as const;
const MAX_BODY_BYTES = 32 * 1024;

function apiError(message: string, status: number) {
  return NextResponse.json(structuredError(status, message), { status });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireOrganization(request);
  if (!auth.authenticated || !auth.organization) {
    return apiError(auth.error || "Unauthorized", auth.status);
  }

  const app = await getApp(auth.organization.id, params.id);
  if (!app) return apiError("App not found", 404);
  return NextResponse.json({ app });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireOrganization(request, MUTATING_ROLES);
  if (!auth.authenticated || !auth.organization) {
    return apiError(auth.error || "Unauthorized", auth.status);
  }

  let text: string;
  try {
    text = await request.text();
  } catch {
    return apiError("Request body could not be read", 400);
  }
  if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) {
    return apiError("Request body exceeds 32 KiB", 413);
  }

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return apiError("Request body must be valid JSON", 400);
  }

  const parsed = updateAppSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      structuredError(400, "Validation failed", parsed.error.errors),
      { status: 400 }
    );
  }

  const app = await updateApp(auth.organization.id, params.id, parsed.data);
  if (!app) return apiError("App not found", 404);
  return NextResponse.json({ app });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireOrganization(request, MUTATING_ROLES);
  if (!auth.authenticated || !auth.organization) {
    return apiError(auth.error || "Unauthorized", auth.status);
  }

  const deleted = await deleteApp(auth.organization.id, params.id);
  if (!deleted) return apiError("App not found", 404);
  return NextResponse.json({ deleted: true });
}
