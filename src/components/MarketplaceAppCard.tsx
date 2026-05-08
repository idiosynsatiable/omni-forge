"use client";

interface Listing {
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

export default function MarketplaceAppCard({ listing }: { listing: Listing }) {
  return (
    <div className={`bg-forge-surface border rounded-xl p-5 transition-all hover:border-forge-cyan/30 ${
      listing.featured ? "border-forge-cyan/20" : "border-forge-border"
    }`}>
      {listing.featured && (
        <span className="inline-block px-2 py-0.5 bg-forge-cyan/10 text-forge-cyan text-xs rounded-full mb-2">
          ⭐ Featured
        </span>
      )}
      <h4 className="font-semibold text-forge-text mb-1">{listing.title}</h4>
      <p className="text-sm text-forge-muted mb-3 line-clamp-2">{listing.description}</p>
      <div className="flex items-center gap-2 mb-3">
        <span className="px-2 py-0.5 bg-forge-border/50 text-forge-muted text-xs rounded">{listing.category}</span>
        <span className="text-xs text-forge-muted">Score: {listing.app.artifactIntegrityScore}</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-forge-amber text-sm">{"★".repeat(Math.round(listing.rating))}</span>
          <span className="text-xs text-forge-muted">{listing.rating.toFixed(1)}</span>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-forge-emerald">
            {listing.price === 0 ? "Free" : `$${listing.price}`}
          </p>
          <p className="text-[10px] text-forge-muted">{listing.cloneCount} clones</p>
        </div>
      </div>
    </div>
  );
}
