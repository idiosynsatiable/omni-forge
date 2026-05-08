"use client";

interface Step {
  label: string;
  status: "complete" | "in-progress" | "pending";
  detail: string;
}

interface Props {
  appName: string;
  steps: Step[];
}

const DEFAULT_STEPS: Step[] = [
  { label: "Generate App", status: "complete", detail: "Source files and configuration generated" },
  { label: "Validate", status: "complete", detail: "TemplateForge validation gate passed" },
  { label: "Deploy Config", status: "in-progress", detail: "Generate Vercel/Railway/Docker configs" },
  { label: "Billing Setup", status: "pending", detail: "Configure Stripe pricing and checkout" },
  { label: "Landing Page", status: "pending", detail: "Generate conversion-optimized landing page" },
  { label: "SEO Setup", status: "pending", detail: "Meta tags, sitemap, Open Graph" },
  { label: "Monitoring", status: "pending", detail: "Health checks and uptime alerts" },
  { label: "Launch", status: "pending", detail: "Deploy to production and announce" },
];

export default function LaunchPlanTimeline({ appName, steps }: Props) {
  const displaySteps = steps.length > 0 ? steps : DEFAULT_STEPS;

  return (
    <div className="bg-forge-surface border border-forge-border rounded-xl p-5">
      <h3 className="font-semibold text-forge-text mb-4">🚀 Launch Timeline — {appName}</h3>
      <div className="space-y-3">
        {displaySteps.map((step, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                step.status === "complete" ? "bg-forge-emerald text-black" :
                step.status === "in-progress" ? "bg-forge-cyan text-black" :
                "bg-forge-border text-forge-muted"
              }`}>
                {step.status === "complete" ? "✓" : i + 1}
              </div>
              {i < displaySteps.length - 1 && (
                <div className={`w-0.5 h-6 ${
                  step.status === "complete" ? "bg-forge-emerald/30" : "bg-forge-border"
                }`} />
              )}
            </div>
            <div>
              <p className={`text-sm font-medium ${
                step.status === "complete" ? "text-forge-emerald" :
                step.status === "in-progress" ? "text-forge-cyan" :
                "text-forge-muted"
              }`}>
                {step.label}
              </p>
              <p className="text-xs text-forge-muted/70">{step.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
