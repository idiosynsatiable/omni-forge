import prisma from "../db";

export interface CatalogEntry {
  id: string;
  appId: string;
  title: string;
  description: string;
  category: string;
  price: number;
  rating: number;
  cloneCount: number;
  featured: boolean;
  app: {
    slug: string;
    status: string;
    artifactIntegrityScore: number;
    deploymentStatus: string;
    estimatedMrr: number;
  };
}

export async function getMarketplaceCatalog(filters?: {
  category?: string;
  featured?: boolean;
  minRating?: number;
}): Promise<CatalogEntry[]> {
  const where: Record<string, unknown> = {};

  if (filters?.category) {
    where.category = filters.category;
  }
  if (filters?.featured !== undefined) {
    where.featured = filters.featured;
  }

  const listings = await prisma.marketplaceListing.findMany({
    where,
    include: {
      app: {
        select: {
          slug: true,
          status: true,
          artifactIntegrityScore: true,
          deploymentStatus: true,
          estimatedMrr: true,
        },
      },
    },
    orderBy: [{ featured: "desc" }, { rating: "desc" }],
  });

  let results = listings as unknown as CatalogEntry[];

  if (filters?.minRating) {
    results = results.filter((l) => l.rating >= (filters.minRating || 0));
  }

  return results;
}

export async function listToMarketplace(data: {
  appId: string;
  title: string;
  description: string;
  category: string;
  price: number;
  featured?: boolean;
}): Promise<CatalogEntry> {
  const listing = await prisma.marketplaceListing.upsert({
    where: { appId: data.appId },
    update: {
      title: data.title,
      description: data.description,
      category: data.category,
      price: data.price,
      featured: data.featured || false,
    },
    create: {
      appId: data.appId,
      title: data.title,
      description: data.description,
      category: data.category,
      price: data.price,
      featured: data.featured || false,
    },
    include: {
      app: {
        select: {
          slug: true,
          status: true,
          artifactIntegrityScore: true,
          deploymentStatus: true,
          estimatedMrr: true,
        },
      },
    },
  });

  await prisma.app.update({
    where: { id: data.appId },
    data: { marketplaceListed: true },
  });

  return listing as unknown as CatalogEntry;
}
