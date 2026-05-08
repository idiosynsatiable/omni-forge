export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getApp, updateApp, deleteApp } from "@/lib/registry";
import { updateAppSchema } from "@/lib/validators";
import { structuredError } from "@/lib/security";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const app = await getApp(params.id);
  if (!app) {
    return NextResponse.json(structuredError(404, "App not found"), { status: 404 });
  }
  return NextResponse.json({ app });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const parsed = updateAppSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      structuredError(400, "Validation failed", parsed.error.errors),
      { status: 400 }
    );
  }

  const app = await updateApp(params.id, parsed.data);
  return NextResponse.json({ app });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  await deleteApp(params.id);
  return NextResponse.json({ deleted: true });
}
