"use client";

import MarketplaceAppCard from "./MarketplaceAppCard";

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

export default function MarketplaceGrid({ listings }: { listings: Listing[] }) {
  const featured = listings.filter((l) => l.featured);
  const rest = listings.filter((l) => !l.featured);

  return (
    <div>
      {featured.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-forge-cyan mb-3">⭐ Featured Templates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featured.map((l) => (
              <MarketplaceAppCard key={l.id} listing={l} />
            ))}
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rest.map((l) => (
          <MarketplaceAppCard key={l.id} listing={l} />
        ))}
      </div>
      {listings.length === 0 && (
        <div className="text-center py-12 text-forge-muted">
          <p className="text-lg mb-2">🏪 No marketplace listings yet</p>
          <p className="text-sm">Generate and validate apps, then list them on the marketplace.</p>
        </div>
      )}
    </div>
  );
}
