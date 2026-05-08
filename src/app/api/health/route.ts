export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getSystemHealth } from "@/lib/health";

export async function GET() {
  const report = await getSystemHealth();
  return NextResponse.json(report);
}
