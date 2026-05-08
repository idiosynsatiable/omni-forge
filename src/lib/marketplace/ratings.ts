import prisma from "../db";

export interface RatingUpdate {
  listingId: string;
  newRating: number;
}

export function calculateAverageRating(
  currentRating: number,
  currentCount: number,
  newRating: number
): number {
  if (currentCount === 0) return newRating;
  const totalScore = currentRating * currentCount + newRating;
  return Math.round((totalScore / (currentCount + 1)) * 100) / 100;
}

export async function updateListingRating(
  listingId: string,
  newRating: number
): Promise<{ rating: number }> {
  const listing = await prisma.marketplaceListing.findUnique({
    where: { id: listingId },
  });

  if (!listing) {
    throw new Error(`Listing ${listingId} not found`);
  }

  const ratingCount = listing.cloneCount || 1;
  const updatedRating = calculateAverageRating(
    listing.rating,
    ratingCount,
    newRating
  );

  await prisma.marketplaceListing.update({
    where: { id: listingId },
    data: { rating: updatedRating },
  });

  return { rating: updatedRating };
}

export function getDifficultyScore(app: {
  category: string;
  priceMonthly: number;
}): number {
  const categoryDifficulty: Record<string, number> = {
    "paid-api": 40,
    "creator-tool": 50,
    "internal-dashboard": 30,
    "ai-utility": 60,
    "ai-tool": 60,
    "seo-tool": 55,
    "resume-career-tool": 45,
    "content-engine": 65,
    "automation-tool": 70,
    "analytics-tool": 55,
  };

  const base = categoryDifficulty[app.category] || 50;
  const priceModifier = Math.min(20, Math.round(app.priceMonthly / 5));
  return Math.min(100, base + priceModifier);
}

export function getRevenuePotentialScore(app: {
  estimatedMrr: number;
  launchPriorityScore: number;
  artifactIntegrityScore: number;
}): number {
  const mrrScore = Math.min(40, Math.round(app.estimatedMrr / 10));
  const launchScore = Math.round(app.launchPriorityScore * 0.35);
  const integrityScore = Math.round(app.artifactIntegrityScore * 0.25);
  return Math.min(100, mrrScore + launchScore + integrityScore);
}
