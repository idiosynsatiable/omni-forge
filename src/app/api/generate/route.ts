export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { generateApp } from "@/lib/app-factory";
import { generateAppSchema } from "@/lib/validators";
import { checkRateLimit, structuredError } from "@/lib/security";

export async function POST(request: Request) {
  const rl = checkRateLimit("generate", 10, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(structuredError(429, "Rate limit exceeded"), { status: 429 });
  }

  const body = await request.json();
  const parsed = generateAppSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      structuredError(400, "Validation failed", parsed.error.errors),
      { status: 400 }
    );
  }

  const result = await generateApp(parsed.data);

  return NextResponse.json({
    app: result.app,
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
}
