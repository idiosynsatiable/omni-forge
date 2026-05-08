export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getCashSaasStatus } from "@/lib/cash-saas";

export async function GET() {
  const status = await getCashSaasStatus();

  return NextResponse.json({
    cashSaas: status,
    timestamp: new Date().toISOString(),
  });
}
