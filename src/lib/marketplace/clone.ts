import prisma from "../db";
import { toSlug } from "../validators";

export interface CloneResult {
  clonedAppId: string;
  clonedSlug: string;
  clonedFrom: string;
  filesCloned: number;
}

export async function cloneApp(
  sourceAppId: string,
  newName: string
): Promise<CloneResult> {
  const source = await prisma.app.findUnique({
    where: { id: sourceAppId },
    include: { generatedFiles: true },
  });

  if (!source) {
    throw new Error(`Source app ${sourceAppId} not found`);
  }

  const newSlug = toSlug(newName);

  const existingPorts = await prisma.app.findMany({
    select: { port: true },
    orderBy: { port: "desc" },
    take: 1,
  });

  const nextPort = existingPorts.length > 0 ? existingPorts[0].port + 1 : 4100;

  const cloned = await prisma.app.create({
    data: {
      name: newName,
      slug: newSlug,
      description: source.description,
      category: source.category,
      status: "draft",
      port: nextPort,
      revenueMode: source.revenueMode,
      priceMonthly: source.priceMonthly,
      usageUnitPrice: source.usageUnitPrice,
      artifactIntegrityScore: 0,
      deploymentStatus: "not_configured",
      estimatedMrr: 0,
    },
  });

  let filesCloned = 0;

  for (const file of source.generatedFiles) {
    const newContent = file.content
      .replace(new RegExp(source.slug, "g"), newSlug)
      .replace(new RegExp(source.name, "g"), newName);

    const newPath = file.path.replace(source.slug, newSlug);

    await prisma.generatedFile.create({
      data: {
        appId: cloned.id,
        path: newPath,
        content: newContent,
        fileType: file.fileType,
      },
    });
    filesCloned++;
  }

  await prisma.marketplaceListing.updateMany({
    where: { appId: sourceAppId },
    data: { cloneCount: { increment: 1 } },
  });

  return {
    clonedAppId: cloned.id,
    clonedSlug: newSlug,
    clonedFrom: source.slug,
    filesCloned,
  };
}
