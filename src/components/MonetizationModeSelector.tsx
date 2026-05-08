// ============================================================================
// Monetization Mode Selector — Omni-Forge Phase 3.5
// Allows users to choose a monetization mode when creating a new
// generated app. Shows description, requirements, and expected behavior.
// ============================================================================

"use client";

import { useState } from "react";
import type { MonetizationMode } from "@/lib/revenue-spine/revenueSpineTypes";

interface MonetizationModeOption {
  value: MonetizationMode;
  label: string;
  description: string;
  icon: string;
  requirements: string[];
  revenueModel: string;
  stripeRequired: boolean;
  apiKeyRequired: boolean;
}

const MODES: MonetizationModeOption[] = [
  {
    value: "static_free_app",
    label: "Static Free App",
    description: "No billing. Free app with no usage tracking or API key enforcement.",
    icon: "🆓",
    requirements: [],
    revenueModel: "None — free to use",
    stripeRequired: false,
    apiKeyRequired: false,
  },
  {
    value: "paid_api_app",
    label: "Paid API App",
    description: "Usage-based API billing. Users pay per request via API keys.",
    icon: "🔑",
    requirements: [
      "Stripe account configured",
      "API key enforcement enabled",
      "Usage metering enabled",
      "Webhook endpoint configured",
    ],
    revenueModel: "Per-request billing (default: $0.01/request)",
    stripeRequired: true,
    apiKeyRequired: true,
  },
  {
    value: "subscription_saas",
    label: "Subscription SaaS",
    description: "Monthly subscription plans with tiered feature access.",
    icon: "💳",
    requirements: [
      "Stripe account configured",
      "Subscription price IDs created",
      "Billing portal enabled",
      "Webhook endpoint configured",
    ],
    revenueModel: "Monthly subscription tiers",
    stripeRequired: true,
    apiKeyRequired: false,
  },
  {
    value: "credit_based_workflow_app",
    label: "Credit-Based Workflow",
    description: "Users pay credits per workflow execution. Integrates with Builder OS credit system.",
    icon: "⚡",
    requirements: [
      "cash-saas-core-v2 connected",
      "Credit pricing configured",
      "Usage metering enabled",
      "API key enforcement enabled",
    ],
    revenueModel: "Per-execution credit consumption",
    stripeRequired: true,
    apiKeyRequired: true,
  },
  {
    value: "marketplace_template",
    label: "Marketplace Template",
    description: "Published as a template on the Builder OS marketplace for others to install.",
    icon: "🏪",
    requirements: [
      "Marketplace account approved",
      "Template validated by TemplateForge",
      "Review submission approved",
    ],
    revenueModel: "70/30 creator/platform split per install",
    stripeRequired: false,
    apiKeyRequired: false,
  },
];

interface MonetizationModeSelectorProps {
  value: MonetizationMode;
  onChange: (mode: MonetizationMode) => void;
  disabled?: boolean;
}

export default function MonetizationModeSelector({ value, onChange, disabled }: MonetizationModeSelectorProps) {
  const [expanded, setExpanded] = useState<MonetizationMode | null>(null);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-900">Monetization Mode</label>
      <div className="space-y-2">
        {MODES.map((mode) => (
          <div
            key={mode.value}
            className={`rounded-xl border-2 p-4 transition-all ${
              value === mode.value
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 bg-white hover:border-gray-300"
            } ${disabled ? "pointer-events-none opacity-60" : "cursor-pointer"}`}
            onClick={() => {
              if (!disabled) {
                onChange(mode.value);
                setExpanded(expanded === mode.value ? null : mode.value);
              }
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{mode.icon}</span>
                <div>
                  <p className="font-medium text-gray-900">{mode.label}</p>
                  <p className="text-xs text-gray-500">{mode.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {mode.stripeRequired && (
                  <span className="rounded bg-purple-100 px-2 py-0.5 text-xs text-purple-700">Stripe</span>
                )}
                {mode.apiKeyRequired && (
                  <span className="rounded bg-orange-100 px-2 py-0.5 text-xs text-orange-700">API Key</span>
                )}
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                    value === mode.value ? "border-blue-500 bg-blue-500" : "border-gray-300"
                  }`}
                >
                  {value === mode.value && (
                    <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                      <circle cx="6" cy="6" r="3" />
                    </svg>
                  )}
                </div>
              </div>
            </div>

            {/* Expanded details */}
            {expanded === mode.value && (
              <div className="mt-4 border-t border-gray-200 pt-4">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="font-medium text-gray-500 uppercase">Revenue Model</p>
                    <p className="mt-1 text-gray-700">{mode.revenueModel}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-500 uppercase">Requirements</p>
                    {mode.requirements.length > 0 ? (
                      <ul className="mt-1 space-y-1">
                        {mode.requirements.map((req, i) => (
                          <li key={i} className="text-gray-700">• {req}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1 text-gray-400">None</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
