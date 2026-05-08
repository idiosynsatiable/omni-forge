export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { runValidationGate } from "@/lib/templateforge/validation-gate";
import { structuredError } from "@/lib/security";

export async function POST(request: Request) {
  const body = await request.json();
  const appId = body.appId;

  if (!appId) {
    return NextResponse.json(
      structuredError(400, "appId is required"),
      { status: 400 }
    );
  }

  const app = await prisma.app.findUnique({
    where: { id: appId },
    include: { generatedFiles: true },
  });

  if (!app) {
    return NextResponse.json(structuredError(404, "App not found"), { status: 404 });
  }

  if (app.generatedFiles.length === 0) {
    return NextResponse.json(
      structuredError(400, "App has no generated files to validate"),
      { status: 400 }
    );
  }

  const files = app.generatedFiles.map((f) => ({
    path: f.path,
    content: f.content,
  }));

  const report = runValidationGate(
    {
      name: app.name,
      slug: app.slug,
      description: app.description,
      category: app.category,
      revenueMode: app.revenueMode,
      priceMonthly: app.priceMonthly,
    },
    files
  );

  await prisma.app.update({
    where: { id: appId },
    data: {
      artifactIntegrityScore: report.artifactScore.score,
      status: report.passed ? "validated" : app.status,
    },
  });

  await prisma.validationIssue.deleteMany({ where: { appId } });

  for (const issue of report.issues) {
    await prisma.validationIssue.create({
      data: {
        appId,
        severity: issue.severity,
        category: issue.category,
        message: issue.message,
        lineNumber: issue.line,
        matchedText: issue.matchedText.slice(0, 200),
        suggestedFix: issue.suggestedFix,
      },
    });
  }

  return NextResponse.json({
    appId,
    appName: app.name,
    ...report,
  });
}
