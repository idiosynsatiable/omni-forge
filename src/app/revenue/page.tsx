export const dynamic = "force-dynamic";
import prisma from "@/lib/db";
import { simulateRevenue } from "@/lib/revenue/simulator";
import { rankAppsByRevenue } from "@/lib/revenue/ranking";
import { analyzeChurn } from "@/lib/revenue/churn";
import { getNextBestApps } from "@/lib/revenue/next-best-app";
import RevenueForecastPanel from "@/components/RevenueForecastPanel";
import RevenueRankingTable from "@/components/RevenueRankingTable";
import NextBestAppPanel from "@/components/NextBestAppPanel";

export default async function RevenuePage() {
  const apps = await prisma.app.findMany();
  const rankings = rankAppsByRevenue(apps);
  const portfolioMrr = apps.reduce((sum, a) => sum + a.estimatedMrr, 0);

  const forecast = simulateRevenue({
    averagePrice: portfolioMrr > 0 ? portfolioMrr / Math.max(apps.length, 1) : 29,
  });

  const churn = analyzeChurn({ monthlyChurnRate: 0.05, averagePrice: 29 });
  const nextBest = getNextBestApps(apps.map((a) => a.slug), 5);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-forge-text">💰 Revenue Intelligence</h1>
        <p className="text-sm text-forge-muted mt-1">
          Portfolio MRR: ${Math.round(portfolioMrr * 100) / 100} · {apps.length} apps
        </p>
      </div>

      <RevenueForecastPanel
        mrr={forecast.mrr}
        annualRevenue={forecast.annualRevenue}
        payingCustomers={forecast.payingCustomers}
        ltv={forecast.ltv}
        churnCategory={churn.churnCategory}
        projections={forecast.projections}
      />

      <RevenueRankingTable rankings={rankings} />

      <NextBestAppPanel candidates={nextBest} />
    </div>
  );
}
