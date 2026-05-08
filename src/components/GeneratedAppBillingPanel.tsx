// ============================================================================
// Generated App Billing Panel — Omni-Forge Phase 3.5
// Shows billing profile, API product sync status, env vars, and
// deployment checklist for a generated app.
// ============================================================================

"use client";

import { useState } from "react";
import type { SyncResult, GeneratedAppBillingEnv, UsagePolicy } from "@/lib/revenue-spine/revenueSpineTypes";
import type { DeploymentChecklistItem } from "@/lib/revenue-spine/billingProfileMapper";

interface GeneratedAppBillingPanelProps {
  appName: string;
  appSlug: string;
  monetizationMode: string;
  billingProfileSync: SyncResult | null;
  apiProductSync: SyncResult | null;
  usagePolicy: UsagePolicy | null;
  billingEnv: GeneratedAppBillingEnv | null;
  deploymentChecklist: DeploymentChecklistItem[];
}

function SyncStatusIndicator({ result }: { result: SyncResult | null }) {
  if (!result) return <span className="text-gray-400 text-xs">Not started</span>;
  if (result.success) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-700">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
        Synced
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-red-700">
      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
      Failed: {result.error ?? "Unknown"}
    </span>
  );
}

export default function GeneratedAppBillingPanel({
  appName,
  appSlug,
  monetizationMode,
  billingProfileSync,
  apiProductSync,
  usagePolicy,
  billingEnv,
  deploymentChecklist,
}: GeneratedAppBillingPanelProps) {
  const [showEnv, setShowEnv] = useState(false);

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-100 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{appName}</h3>
            <p className="text-sm text-gray-500">{appSlug} · {monetizationMode}</p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              monetizationMode === "static_free_app"
                ? "bg-gray-100 text-gray-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            {monetizationMode.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      {/* Sync Status */}
      <div className="border-b border-gray-100 px-6 py-4">
        <h4 className="text-sm font-medium text-gray-900">Sync Status</h4>
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Billing Profile</span>
            <SyncStatusIndicator result={billingProfileSync} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">API Product</span>
            <SyncStatusIndicator result={apiProductSync} />
          </div>
        </div>
      </div>

      {/* Usage Policy */}
      {usagePolicy && monetizationMode !== "static_free_app" && (
        <div className="border-b border-gray-100 px-6 py-4">
          <h4 className="text-sm font-medium text-gray-900">Usage Policy</h4>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div>
              <dt className="text-gray-500">Metering</dt>
              <dd className="font-medium">{usagePolicy.metering_enabled ? "Enabled" : "Disabled"}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Unit</dt>
              <dd className="font-medium">{usagePolicy.usage_unit}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Rate Limit</dt>
              <dd className="font-medium">{usagePolicy.rate_limit_rpm} rpm</dd>
            </div>
            <div>
              <dt className="text-gray-500">API Key</dt>
              <dd className="font-medium">{usagePolicy.api_key_required ? "Required" : "Not required"}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Webhook</dt>
              <dd className="font-medium">{usagePolicy.webhook_required ? "Required" : "Not required"}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Overage</dt>
              <dd className="font-medium capitalize">{usagePolicy.overage_behavior}</dd>
            </div>
          </dl>
        </div>
      )}

      {/* Environment Variables */}
      {billingEnv && monetizationMode !== "static_free_app" && (
        <div className="border-b border-gray-100 px-6 py-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">Billing Environment</h4>
            <button
              onClick={() => setShowEnv(!showEnv)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              {showEnv ? "Hide" : "Show"}
            </button>
          </div>
          {showEnv && (
            <pre className="mt-3 overflow-x-auto rounded-lg bg-gray-900 p-4 text-xs text-green-400">
              {Object.entries(billingEnv)
                .map(([key, value]) => `${key}=${value || "(set before deploy)"}`)
                .join("\n")}
            </pre>
          )}
        </div>
      )}

      {/* Deployment Checklist */}
      {deploymentChecklist.length > 0 && (
        <div className="px-6 py-4">
          <h4 className="text-sm font-medium text-gray-900">Deployment Checklist</h4>
          <ul className="mt-3 space-y-2">
            {deploymentChecklist.map((item) => (
              <li key={item.step} className="flex items-start gap-2">
                <span
                  className={`mt-0.5 flex h-4 w-4 items-center justify-center rounded-full text-xs ${
                    item.completed
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {item.completed ? "✓" : item.step}
                </span>
                <div>
                  <p className={`text-sm ${item.completed ? "text-gray-500 line-through" : "text-gray-700"}`}>
                    {item.action}
                  </p>
                  <p className="text-xs text-gray-400">{item.details}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
