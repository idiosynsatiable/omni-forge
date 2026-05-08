"use client";

import { useEffect, useState } from "react";

interface CashSaasStatus {
  connected: boolean;
  platform: string | null;
  features: string[];
  plans: string[];
  error: string | null;
}

export default function CashSaasStatusPanel() {
  const [status, setStatus] = useState<CashSaasStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/cash-saas/status")
      .then((r) => r.json())
      .then((data) => {
        setStatus(data.cashSaas);
        setLoading(false);
      })
      .catch(() => {
        setStatus({
          connected: false,
          platform: null,
          features: [],
          plans: [],
          error: "Failed to reach status endpoint",
        });
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="bg-forge-surface border border-forge-border rounded-xl p-5">
        <h3 className="font-semibold text-forge-text mb-3">💰 Cash SaaS Core V2</h3>
        <p className="text-sm text-forge-muted">Checking connection...</p>
      </div>
    );
  }

  if (!status) return null;

  return (
    <div className="bg-forge-surface border border-forge-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-forge-text">💰 Cash SaaS Core V2 — Monetization Backend</h3>
        <span
          className={`text-xs px-2 py-1 rounded-full font-medium ${
            status.connected
              ? "bg-forge-emerald/20 text-forge-emerald"
              : "bg-forge-red/20 text-forge-red"
          }`}
        >
          {status.connected ? "● Connected" : "● Disconnected"}
        </span>
      </div>

      {status.connected ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-forge-muted mb-1">Platform</p>
            <p className="text-sm text-forge-text font-medium">{status.platform}</p>
          </div>
          <div>
            <p className="text-xs text-forge-muted mb-1">Plans Available</p>
            <div className="flex flex-wrap gap-1">
              {status.plans.map((plan) => (
                <span
                  key={plan}
                  className="text-xs px-2 py-0.5 bg-forge-bg border border-forge-border rounded-full text-forge-muted"
                >
                  {plan}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-forge-muted mb-1">Features ({status.features.length})</p>
            <p className="text-xs text-forge-muted/70">
              {status.features.slice(0, 4).join(", ")}
              {status.features.length > 4 && ` +${status.features.length - 4} more`}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-forge-muted">
            {status.error || "Cash SaaS backend is not configured."}
          </p>
          <div className="bg-forge-bg border border-forge-border rounded-lg p-3">
            <p className="text-xs text-forge-muted mb-2">To enable, set these environment variables:</p>
            <code className="text-xs text-forge-cyan block">
              # Integration auto-enables when both vars are set
              <br />
              CASH_SAAS_CORE_URL=http://your-cash-saas-instance:8000
              <br />
              CASH_SAAS_ADMIN_API_KEY=your_jwt_token
            </code>
          </div>
        </div>
      )}
    </div>
  );
}
