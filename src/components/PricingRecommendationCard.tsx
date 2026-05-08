"use client";

interface Tier {
  name: string;
  price: number;
  features: string[];
}

interface Props {
  recommendedPrice: number;
  confidence: number;
  rationale: string;
  tiers: Tier[];
  upsellPath: string;
}

export default function PricingRecommendationCard(props: Props) {
  return (
    <div className="bg-forge-surface border border-forge-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-forge-text">💵 Pricing Recommendation</h3>
        <span className="text-sm text-forge-muted">{Math.round(props.confidence * 100)}% confidence</span>
      </div>

      <div className="bg-forge-bg/50 rounded-lg p-4 mb-4">
        <p className="text-sm text-forge-text/80 mb-2">{props.rationale}</p>
        <p className="text-2xl font-bold text-forge-emerald">${props.recommendedPrice}/mo</p>
        <p className="text-xs text-forge-muted mt-1">Upsell: {props.upsellPath}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {props.tiers.map((tier) => (
          <div key={tier.name} className="border border-forge-border/50 rounded-lg p-3 text-center">
            <p className="text-xs text-forge-muted mb-1">{tier.name}</p>
            <p className="text-sm font-bold text-forge-text">
              {tier.price === 0 ? "Free" : `$${tier.price}/mo`}
            </p>
            <div className="mt-2">
              {tier.features.slice(0, 2).map((f, i) => (
                <p key={i} className="text-[10px] text-forge-muted/70">{f}</p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
