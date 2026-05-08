export const dynamic = "force-dynamic";
import { getApp } from "@/lib/registry";
import { calculateHealthScore } from "@/lib/health";
import AppDetailPanel from "@/components/AppDetailPanel";
import { notFound } from "next/navigation";

export default async function AppDetailPage({ params }: { params: { id: string } }) {
  const app = await getApp(params.id);

  if (!app) {
    notFound();
  }

  const health = calculateHealthScore(app);

  return (
    <div className="p-6">
      <AppDetailPanel
        app={{
          id: app.id,
          name: app.name,
          slug: app.slug,
          description: app.description,
          category: app.category,
          status: app.status,
          port: app.port,
          healthScore: health.score,
          artifactIntegrityScore: app.artifactIntegrityScore,
          deploymentStatus: app.deploymentStatus,
          deploymentProvider: app.deploymentProvider || "",
          liveUrl: app.liveUrl || "",
          revenueMode: app.revenueMode,
          priceMonthly: app.priceMonthly,
          estimatedMrr: app.estimatedMrr,
          revenueProbabilityScore: app.revenueProbabilityScore,
          launchPriorityScore: app.launchPriorityScore,
          marketplaceListed: app.marketplaceListed,
          generatedFiles: app.generatedFiles.map((f) => ({
            id: f.id,
            path: f.path,
            fileType: f.fileType,
          })),
          validationIssues: app.validationIssues.map((v) => ({
            id: v.id,
            severity: v.severity,
            message: v.message,
            category: v.category,
          })),
          agentProposals: app.agentProposals.map((p) => ({
            id: p.id,
            agentName: p.agentName,
            summary: p.summary,
            confidence: p.confidence,
            status: p.status,
          })),
        }}
      />
    </div>
  );
}
