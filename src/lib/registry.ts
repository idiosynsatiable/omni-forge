import prisma from "./db";
import { toSlug } from "./validators";

function assertOrganizationId(organizationId: number): void {
  if (!Number.isSafeInteger(organizationId) || organizationId <= 0) {
    throw new Error("A positive organization id is required");
  }
}

export async function listApps(
  organizationId: number,
  filters?: { status?: string; category?: string }
) {
  assertOrganizationId(organizationId);
  const where: Record<string, unknown> = { organizationId };
  if (filters?.status) where.status = filters.status;
  if (filters?.category) where.category = filters.category;

  return prisma.app.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      marketplaceListing: true,
      _count: {
        select: {
          generatedFiles: true,
          validationIssues: true,
          agentProposals: true,
        },
      },
    },
  });
}

export async function getApp(organizationId: number, id: string) {
  assertOrganizationId(organizationId);
  return prisma.app.findFirst({
    where: { id, organizationId },
    include: {
      generatedFiles: true,
      validationIssues: { orderBy: { createdAt: "desc" } },
      agentProposals: { orderBy: { createdAt: "desc" }, take: 20 },
      marketplaceListing: true,
      revenueSnapshots: { orderBy: { createdAt: "desc" }, take: 5 },
      deploymentChecks: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });
}

export async function createApp(
  organizationId: number,
  userId: number,
  data: {
    name: string;
    description: string;
    category: string;
    revenueMode: string;
    priceMonthly: number;
  }
) {
  assertOrganizationId(organizationId);
  const slug = toSlug(data.name);
  if (!slug) throw new Error("App name does not produce a safe slug");
  const nextPort = await getNextPort();

  return prisma.app.create({
    data: {
      ...data,
      organizationId,
      createdByUserId: userId,
      slug,
      port: nextPort,
      status: "draft",
    },
  });
}

export async function updateApp(
  organizationId: number,
  id: string,
  data: Record<string, unknown>
) {
  assertOrganizationId(organizationId);
  const owned = await prisma.app.findFirst({
    where: { id, organizationId },
    select: { id: true },
  });
  if (!owned) return null;
  return prisma.app.update({ where: { id: owned.id }, data });
}

export async function deleteApp(organizationId: number, id: string) {
  assertOrganizationId(organizationId);
  const owned = await prisma.app.findFirst({
    where: { id, organizationId },
    select: { id: true },
  });
  if (!owned) return false;
  await prisma.app.delete({ where: { id: owned.id } });
  return true;
}

export async function getNextPort(): Promise<number> {
  const maxPort = await prisma.app.aggregate({ _max: { port: true } });
  return (maxPort._max.port || 4099) + 1;
}
