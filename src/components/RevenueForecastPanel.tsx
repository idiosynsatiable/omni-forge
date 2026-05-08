"use client";

interface Props {
  mrr: number;
  annualRevenue: number;
  payingCustomers: number;
  ltv: number;
  churnCategory: string;
  projections: Array<{ month: number; customers: number; revenue: number; cumulativeRevenue: number }>;
}

export default function RevenueForecastPanel(props: Props) {
  const maxRev = Math.max(...props.projections.map((p) => p.revenue), 1);

  return (
    <div className="bg-forge-surface border border-forge-border rounded-xl p-5">
      <h3 className="font-semibold text-forge-text mb-4">💰 Revenue Forecast</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <MiniStat label="MRR" value={`$${props.mrr}`} color="text-forge-emerald" />
        <MiniStat label="Annual" value={`$${props.annualRevenue}`} color="text-forge-cyan" />
        <MiniStat label="Paying" value={String(props.payingCustomers)} color="text-forge-violet" />
        <MiniStat label="LTV" value={`$${props.ltv}`} color="text-forge-amber" />
      </div>

      <div className="flex items-end gap-1 h-24 mb-2">
        {props.projections.map((p) => (
          <div key={p.month} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full bg-forge-cyan/30 rounded-t hover:bg-forge-cyan/50 transition-colors"
              style={{ height: `${(p.revenue / maxRev) * 100}%`, minHeight: "2px" }}
            />
            <span className="text-[10px] text-forge-muted">M{p.month}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-forge-border/50">
        <span className="text-xs text-forge-muted">Churn: {props.churnCategory}</span>
        <span className="text-xs text-forge-muted">
          12-mo projection: ${props.projections[props.projections.length - 1]?.cumulativeRevenue || 0}
        </span>
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-forge-bg/50 rounded-lg p-2 text-center">
      <p className="text-[10px] text-forge-muted">{label}</p>
      <p className={`text-sm font-bold ${color}`}>{value}</p>
    </div>
  );
}
