export interface ChurnAnalysis {
  monthlyChurnRate: number;
  annualChurnRate: number;
  retentionRate: number;
  averageLifetimeMonths: number;
  ltv: number;
  churnCategory: string;
  recommendation: string;
}

export function analyzeChurn(inputs: {
  monthlyChurnRate: number;
  averagePrice: number;
}): ChurnAnalysis {
  const { monthlyChurnRate, averagePrice } = inputs;

  const annualChurnRate = 1 - Math.pow(1 - monthlyChurnRate, 12);
  const retentionRate = 1 - monthlyChurnRate;
  const averageLifetimeMonths = monthlyChurnRate > 0 ? 1 / monthlyChurnRate : 240;
  const ltv = averagePrice * averageLifetimeMonths;

  let churnCategory: string;
  let recommendation: string;

  if (monthlyChurnRate <= 0.02) {
    churnCategory = "excellent";
    recommendation = "Churn is best-in-class. Focus on expansion revenue and upsells.";
  } else if (monthlyChurnRate <= 0.05) {
    churnCategory = "healthy";
    recommendation = "Churn is within normal SaaS range. Monitor for trends and improve onboarding.";
  } else if (monthlyChurnRate <= 0.10) {
    churnCategory = "concerning";
    recommendation = "Churn is above average. Investigate top cancellation reasons. Add retention hooks (annual discounts, feature gates).";
  } else {
    churnCategory = "critical";
    recommendation = "Churn is dangerously high. Product-market fit may be weak. Run user interviews and consider pivoting the value proposition.";
  }

  return {
    monthlyChurnRate,
    annualChurnRate: Math.round(annualChurnRate * 1000) / 1000,
    retentionRate: Math.round(retentionRate * 1000) / 1000,
    averageLifetimeMonths: Math.round(averageLifetimeMonths * 10) / 10,
    ltv: Math.round(ltv * 100) / 100,
    churnCategory,
    recommendation,
  };
}
