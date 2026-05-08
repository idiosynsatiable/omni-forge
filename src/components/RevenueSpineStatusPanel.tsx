// ============================================================================
// Revenue Spine Status Panel — Omni-Forge Phase 3.5
// Dashboard component showing the revenue spine connection status,
// capabilities, Stripe mode, sync status, and deployment readiness.
// ============================================================================

"use client";

import { useEffect, useState } from "react";
import type { RevenueSpineHealth, DeploymentReadinessScore } from "@/lib/revenue-spine/revenueSpineTypes";

interface RevenueSpineStatusData {
  status: string;
  health: RevenueSpineHealth;
  timestamp: string;
}

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        ok ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-green-500" : "bg-red-500"}`} />
      {label}
    </span>
  );
}

function StripeBadge({ mode }: { mode: string }) {
  const colors: Record<string, string> = {
    live: "bg-green-100 text-green-800",
    test: "bg-yellow-100 text-yellow-800",
    disabled: "bg-gray-100 text-gray-800",
    unknown: "bg-red-100 text-red-800",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[mode] ?? colors.unknown}`}>
      Stripe: {mode}
    </span>
  );
}

export default function RevenueSpineStatusPanel() {
  const [data, setData] = useState<RevenueSpineStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHealth() {
      try {
        const res = await fetch("/api/revenue-spine/health");
        if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch health");
      } finally {
        setLoading(false);
      }
    }
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">Revenue Spine</h3>
        <p className="mt-2 text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-red-900">Revenue Spine</h3>
        <p className="mt-2 text-sm text-red-700">{error ?? "No data available"}</p>
      </div>
    );
  }

  const h = data.health;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Revenue Spine</h3>
        <StatusBadge ok={data.status === "healthy"} label={data.status} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        {/* Connection */}
        <div>
          <p className="text-xs font-medium uppercase text-gray-500">Connection</p>
          <StatusBadge ok={h.platform_reachable} label={h.platform_reachable ? "Connected" : "Unreachable"} />
        </div>

        {/* Stripe Mode */}
        <div>
          <p className="text-xs font-medium uppercase text-gray-500">Stripe</p>
          <StripeBadge mode={h.stripe_mode} />
        </div>

        {/* cash-saas-core URL */}
        <div className="col-span-2">
          <p className="text-xs font-medium uppercase text-gray-500">cash-saas-core-v2</p>
          <p className="mt-1 truncate text-sm text-gray-700">{h.cash_saas_core_url ?? "Not configured"}</p>
        </div>

        {/* Capabilities */}
        {h.capabilities && (
          <div className="col-span-2">
            <p className="mb-2 text-xs font-medium uppercase text-gray-500">Platform: {h.capabilities.platform}</p>
            <div className="flex flex-wrap gap-2">
              {h.capabilities.features.map((feature: string) => (
                <StatusBadge key={feature} ok={true} label={feature.replace(/_/g, " ")} />
              ))}
            </div>
            <p className="mt-2 text-xs font-medium uppercase text-gray-500">Plans</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {Object.keys(h.capabilities.plans).map((plan: string) => (
                <span key={plan} className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                  {plan}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Sync Status */}
        <div>
          <p className="text-xs font-medium uppercase text-gray-500">Last Sync</p>
          <p className="mt-1 text-sm text-gray-700">
            {h.last_sync_at ? new Date(h.last_sync_at).toLocaleString() : "Never"}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-gray-500">Sync Result</p>
          <StatusBadge ok={h.last_sync_status === "success"} label={h.last_sync_status} />
        </div>
      </div>

      {/* Errors */}
      {h.errors.length > 0 && (
        <div className="mt-4 rounded-lg bg-red-50 p-3">
          <p className="text-xs font-medium text-red-800">Issues:</p>
          <ul className="mt-1 space-y-1">
            {h.errors.map((err, i) => (
              <li key={i} className="text-xs text-red-700">• {err}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
