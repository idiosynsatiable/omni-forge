export const dynamic = "force-dynamic";
import { listApps } from "@/lib/registry";
import { calculateHealthScore } from "@/lib/health";
import AppRegistryTable from "@/components/AppRegistryTable";
import AppCard from "@/components/AppCard";

export default async function AppsPage() {
  const apps = await listApps();

  const enriched = apps.map((app) => ({
    ...app,
    healthScore: calculateHealthScore(app).score,
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-forge-text">🚀 App Fleet</h1>
          <p className="text-sm text-forge-muted mt-1">{apps.length} apps in registry</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {enriched.map((app) => (
          <AppCard
            key={app.id}
            id={app.id}
            name={app.name}
            slug={app.slug}
            description={app.description}
            category={app.category}
            status={app.status}
            port={app.port}
            healthScore={app.healthScore}
            artifactIntegrityScore={app.artifactIntegrityScore}
            deploymentStatus={app.deploymentStatus}
            estimatedMrr={app.estimatedMrr}
            priceMonthly={app.priceMonthly}
          />
        ))}
      </div>

      <AppRegistryTable
        apps={enriched.map((a) => ({
          id: a.id,
          name: a.name,
          slug: a.slug,
          category: a.category,
          status: a.status,
          port: a.port,
          healthScore: a.healthScore,
          artifactIntegrityScore: a.artifactIntegrityScore,
          deploymentStatus: a.deploymentStatus,
          estimatedMrr: a.estimatedMrr,
          priceMonthly: a.priceMonthly,
        }))}
      />
    </div>
  );
}
