export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { listApps, createApp } from "@/lib/registry";
import { createAppSchema } from "@/lib/validators";
import { checkRateLimit, structuredError } from "@/lib/security";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || undefined;
  const category = searchParams.get("category") || undefined;

  const apps = await listApps({ status, category });
  return NextResponse.json({ apps, total: apps.length });
}

export async function POST(request: Request) {
  const rl = checkRateLimit("apps-create", 20, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(structuredError(429, "Rate limit exceeded"), { status: 429 });
  }

  const body = await request.json();
  const parsed = createAppSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      structuredError(400, "Validation failed", parsed.error.errors),
      { status: 400 }
    );
  }

  const app = await createApp(parsed.data);
  return NextResponse.json({ app }, { status: 201 });
}
