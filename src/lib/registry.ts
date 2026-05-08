import prisma from "./db";
import { toSlug } from "./validators";

export async function listApps(filters?: { status?: string; category?: string }) {
  const where: Record<string, unknown> = {};
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

export async function getApp(id: string) {
  return prisma.app.findUnique({
    where: { id },
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

export async function createApp(data: {
  name: string;
  description: string;
  category: string;
  revenueMode: string;
  priceMonthly: number;
}) {
  const slug = toSlug(data.name);
  const nextPort = await getNextPort();

  return prisma.app.create({
    data: {
      ...data,
      slug,
      port: nextPort,
      status: "draft",
    },
  });
}

export async function updateApp(id: string, data: Record<string, unknown>) {
  return prisma.app.update({ where: { id }, data });
}

export async function deleteApp(id: string) {
  return prisma.app.delete({ where: { id } });
}

export async function getNextPort(): Promise<number> {
  const maxPort = await prisma.app.aggregate({ _max: { port: true } });
  return (maxPort._max.port || 4099) + 1;
}
