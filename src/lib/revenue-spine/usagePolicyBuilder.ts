// ============================================================================
// Usage Policy Builder — Omni-Forge Phase 3.5
// Builds usage policies and quota configurations for generated apps.
// Re-exports the core function from billingProfileMapper and adds
// quota policy generation and env var recommendations.
// ============================================================================

import { buildUsagePolicy, type GeneratedAppMetadata } from "./billingProfileMapper";
import type { UsagePolicy, MonetizationMode } from "./revenueSpineTypes";

// ── Quota Policy ────────────────────────────────────────────────────────────

export interface QuotaPolicy {
  name: string;
  description: string;
  limits: QuotaLimit[];
  enforcement: "hard" | "soft";
  grace_period_minutes: number;
  notification_thresholds: number[];
}

export interface QuotaLimit {
  metric: string;
  limit: number;
  window: "minute" | "hour" | "day" | "month";
  action_on_exceed: "block" | "charge_overage" | "degrade" | "log_only";
}

export function buildQuotaPolicy(app: GeneratedAppMetadata): QuotaPolicy {
  const usagePolicy = buildUsagePolicy(app);

  const limits: QuotaLimit[] = [];

  // Rate limits
  if (usagePolicy.rate_limit_rpm > 0) {
    limits.push({
      metric: "requests",
      limit: usagePolicy.rate_limit_rpm,
      window: "minute",
      action_on_exceed: "block",
    });
  }

  if (usagePolicy.rate_limit_rpd > 0) {
    limits.push({
      metric: "requests",
      limit: usagePolicy.rate_limit_rpd,
      window: "day",
      action_on_exceed: usagePolicy.overage_behavior === "charge" ? "charge_overage" : "block",
    });
  }

  // Monthly usage limit
  if (usagePolicy.free_tier_limit > 0) {
    limits.push({
      metric: usagePolicy.usage_unit,
      limit: usagePolicy.free_tier_limit,
      window: "month",
      action_on_exceed:
        usagePolicy.overage_behavior === "charge"
          ? "charge_overage"
          : usagePolicy.overage_behavior === "degrade"
            ? "degrade"
            : "block",
    });
  }

  const enforcement: "hard" | "soft" =
    usagePolicy.overage_behavior === "block" ? "hard" : "soft";

  return {
    name: `${app.appSlug}-quota`,
    description: `Quota policy for ${app.appName} (${app.monetizationMode})`,
    limits,
    enforcement,
    grace_period_minutes: enforcement === "soft" ? 5 : 0,
    notification_thresholds: [50, 80, 95, 100],
  };
}

// ── Recommended Env Vars ────────────────────────────────────────────────────

export interface RecommendedEnvVar {
  name: string;
  description: string;
  required: boolean;
  example: string;
  sensitive: boolean;
}

export function buildRecommendedEnvVars(app: GeneratedAppMetadata): RecommendedEnvVar[] {
  const vars: RecommendedEnvVar[] = [];

  // Always recommended
  vars.push({
    name: "PUBLIC_APP_URL",
    description: "Public-facing URL of the deployed application",
    required: true,
    example: `https://${app.appSlug}.vercel.app`,
    sensitive: false,
  });

  if (app.monetizationMode === "static_free_app") {
    return vars;
  }

  // All monetized apps need these
  vars.push(
    {
      name: "CASH_SAAS_CORE_URL",
      description: "URL of the cash-saas-core-v2 API",
      required: true,
      example: "https://api.builderos.ai",
      sensitive: false,
    },
    {
      name: "CASH_SAAS_ORG_ID",
      description: "Organization ID in cash-saas-core-v2",
      required: true,
      example: "org_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      sensitive: false,
    },
    {
      name: "CASH_SAAS_PRODUCT_ID",
      description: "Product/app ID registered in cash-saas-core-v2",
      required: true,
      example: "prod_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      sensitive: false,
    },
    {
      name: "CASH_SAAS_API_KEY",
      description: "API key for authenticating with cash-saas-core-v2",
      required: true,
      example: "",
      sensitive: true,
    },
    {
      name: "CASH_SAAS_REVENUE_MODE",
      description: "Revenue/monetization mode for this app",
      required: true,
      example: app.monetizationMode,
      sensitive: false,
    },
  );

  // Usage metering
  if (["paid_api_app", "credit_based_workflow_app"].includes(app.monetizationMode)) {
    vars.push(
      {
        name: "CASH_SAAS_USAGE_UNIT",
        description: "Unit of usage measurement (request, workflow_execution, etc.)",
        required: true,
        example: app.monetizationMode === "credit_based_workflow_app" ? "workflow_execution" : "request",
        sensitive: false,
      },
      {
        name: "CASH_SAAS_USAGE_PRICE_CENTS",
        description: "Price per usage unit in cents",
        required: true,
        example: app.monetizationMode === "credit_based_workflow_app" ? "5" : "1",
        sensitive: false,
      },
    );
  }

  // Stripe
  if (["subscription_saas", "paid_api_app"].includes(app.monetizationMode)) {
    vars.push({
      name: "STRIPE_PRICE_ID",
      description: "Stripe price ID for the subscription or product",
      required: true,
      example: "price_xxxxxxxxxxxxxxxxxxxx",
      sensitive: false,
    });
  }

  return vars;
}

// ── Env File Generator ──────────────────────────────────────────────────────

export function generateEnvExample(app: GeneratedAppMetadata): string {
  const vars = buildRecommendedEnvVars(app);
  const lines: string[] = [
    `# ${app.appName} — Environment Variables`,
    `# Generated by Omni-Forge Phase 3.5 Revenue Spine`,
    `# Monetization mode: ${app.monetizationMode}`,
    "",
  ];

  for (const v of vars) {
    lines.push(`# ${v.description}`);
    if (v.required) lines.push(`# REQUIRED`);
    if (v.sensitive) lines.push(`# ⚠ SENSITIVE — do not commit`);
    lines.push(`${v.name}=${v.example}`);
    lines.push("");
  }

  return lines.join("\n");
}

// Re-export for convenience
export { buildUsagePolicy };
