export const dynamic = "force-dynamic";
import { getMarketplaceCatalog } from "@/lib/marketplace/catalog";
import MarketplaceGrid from "@/components/MarketplaceGrid";

export default async function MarketplacePage() {
  const listings = await getMarketplaceCatalog();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-forge-text">🏪 App Marketplace</h1>
        <p className="text-sm text-forge-muted mt-1">
          {listings.length} templates available · Clone, customize, and deploy
        </p>
      </div>

      <MarketplaceGrid listings={listings as any} />
    </div>
  );
}
