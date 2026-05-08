export interface RevenueInputs {
  visitorsPerMonth: number;
  conversionRate: number;
  churnRate: number;
  averagePrice: number;
  grossMargin: number;
}

export interface RevenueProjection {
  mrr: number;
  netRevenueEstimate: number;
  retentionAdjustedRevenue: number;
  annualRevenue: number;
  payingCustomers: number;
  ltv: number;
  monthlyChurnedCustomers: number;
  monthlyNewCustomers: number;
  breakEvenMonth: number;
  twelveMonthRevenue: number;
  projections: Array<{
    month: number;
    customers: number;
    revenue: number;
    cumulativeRevenue: number;
  }>;
}

export const DEFAULT_INPUTS: RevenueInputs = {
  visitorsPerMonth: 1000,
  conversionRate: 0.04,
  churnRate: 0.05,
  averagePrice: 29,
  grossMargin: 0.85,
};

export function simulateRevenue(
  inputs: Partial<RevenueInputs> = {}
): RevenueProjection {
  const i = { ...DEFAULT_INPUTS, ...inputs };

  const monthlyNewCustomers = Math.round(i.visitorsPerMonth * i.conversionRate);
  const payingCustomers = monthlyNewCustomers;
  const mrr = payingCustomers * i.averagePrice;
  const netRevenueEstimate = mrr * i.grossMargin;
  const retentionAdjustedRevenue = netRevenueEstimate * (1 - i.churnRate);
  const ltv = i.churnRate > 0 ? i.averagePrice / i.churnRate : i.averagePrice * 24;

  const projections: RevenueProjection["projections"] = [];
  let cumCustomers = 0;
  let cumRevenue = 0;

  for (let month = 1; month <= 12; month++) {
    cumCustomers = cumCustomers + monthlyNewCustomers - Math.round(cumCustomers * i.churnRate);
    cumCustomers = Math.max(0, cumCustomers);
    const monthlyRevenue = cumCustomers * i.averagePrice * i.grossMargin;
    cumRevenue += monthlyRevenue;

    projections.push({
      month,
      customers: cumCustomers,
      revenue: Math.round(monthlyRevenue * 100) / 100,
      cumulativeRevenue: Math.round(cumRevenue * 100) / 100,
    });
  }

  const monthlyChurnedCustomers = Math.round(payingCustomers * i.churnRate);
  const breakEvenMonth = mrr > 0 ? Math.ceil(100 / mrr) + 1 : 0;

  return {
    mrr: Math.round(mrr * 100) / 100,
    netRevenueEstimate: Math.round(netRevenueEstimate * 100) / 100,
    retentionAdjustedRevenue: Math.round(retentionAdjustedRevenue * 100) / 100,
    annualRevenue: Math.round(retentionAdjustedRevenue * 12 * 100) / 100,
    payingCustomers,
    ltv: Math.round(ltv * 100) / 100,
    monthlyChurnedCustomers,
    monthlyNewCustomers,
    breakEvenMonth,
    twelveMonthRevenue: Math.round(cumRevenue * 100) / 100,
    projections,
  };
}
