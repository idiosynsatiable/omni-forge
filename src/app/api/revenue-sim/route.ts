export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { simulateRevenue } from "@/lib/revenue/simulator";
import { rankAppsByRevenue } from "@/lib/revenue/ranking";
import { analyzeChurn } from "@/lib/revenue/churn";
import { getNextBestApps } from "@/lib/revenue/next-best-app";
import { recommendPricing } from "@/lib/revenue/pricing-engine";
import { revenueSimSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = revenueSimSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.errors },
      { status: 400 }
    );
  }

  const forecast = simulateRevenue(parsed.data);

  const churn = analyzeChurn({
    monthlyChurnRate: parsed.data.churnRate ?? 0.05,
    averagePrice: parsed.data.averagePrice ?? 29,
  });

  const apps = await prisma.app.findMany();
  const rankings = rankAppsByRevenue(apps);

  const existingSlugs = apps.map((a) => a.slug);
  const nextBest = getNextBestApps(existingSlugs, 3);

  let pricingRec = null;
  if (parsed.data.appId) {
    const app = apps.find((a) => a.id === parsed.data.appId);
    if (app) {
      pricingRec = recommendPricing({
        category: app.category,
        revenueMode: app.revenueMode,
        priceMonthly: app.priceMonthly,
        description: app.description,
      });
    }
  }

  const portfolioMrr = apps.reduce((sum, a) => sum + a.estimatedMrr, 0);

  return NextResponse.json({
    forecast,
    churnAnalysis: churn,
    portfolio: {
      totalApps: apps.length,
      portfolioMrr: Math.round(portfolioMrr * 100) / 100,
      annualProjection: Math.round(portfolioMrr * 12 * 100) / 100,
      rankings: rankings.slice(0, 10),
      underMonetized: rankings.filter((r) => r.underMonetized),
    },
    nextBestApps: nextBest,
    ...(pricingRec ? { pricingRecommendation: pricingRec } : {}),
  });
}
