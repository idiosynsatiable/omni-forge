export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { checkDeployReadiness } from "@/lib/deployment/deploy-readiness";
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

  const files = app.generatedFiles.map((f) => ({
    path: f.path,
    content: f.content,
  }));

  const result = checkDeployReadiness(files, {
    slug: app.slug,
    revenueMode: app.revenueMode,
    artifactIntegrityScore: app.artifactIntegrityScore,
  });

  await prisma.deploymentCheck.create({
    data: {
      appId,
      provider: "generic",
      readinessScore: result.score,
      missingItemsJson: JSON.stringify(result.missingItems),
      status: result.status,
    },
  });

  await prisma.app.update({
    where: { id: appId },
    data: { deploymentStatus: result.status },
  });

  return NextResponse.json({
    appId,
    appName: app.name,
    ...result,
  });
}
