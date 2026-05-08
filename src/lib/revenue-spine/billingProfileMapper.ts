// ============================================================================
// Billing Profile Mapper — Omni-Forge Phase 3.5
// Maps generated app metadata to cash-saas-core-v2 billing profiles.
// Matches the real POST /omni/* endpoint schemas.
// ============================================================================

import type {
  CreateBillingProfileRequest,
  CreateApiProductRequest,
  UsagePolicy,
  GeneratedAppBillingEnv,
} from "./revenueSpineTypes";

// ── Generated App Metadata ──────────────────────────────────────────────────

export interface GeneratedAppMetadata {
  appName: string;
  appSlug: string;
  appId?: string; // set after registration
  description?: string;
  monetizationMode: string;
  features: string[];
  expectedMonthlyUsers?: number;
  expectedRequestsPerUser?: number;
  hasAuth: boolean;
  hasDashboard: boolean;
  hasApi: boolean;
}

// ── Billing Profile Mapper ──────────────────────────────────────────────────
// Maps to POST /omni/create-billing-profile

export function mapToBillingProfile(app: GeneratedAppMetadata): CreateBillingProfileRequest | null {
  switch (app.monetizationMode) {
    case "static_free_app":
      return null;

    case "paid_api_app":
      return {
        app_name: app.appName,
        app_slug: app.appSlug,
        revenue_mode: "subscription_plus_usage",
        usage_unit: "api_call",
        usage_price_cents: 5,
      };

    case "subscription_saas":
    case "subscription_plus_usage":
      return {
        app_name: app.appName,
        app_slug: app.appSlug,
        revenue_mode: "subscription_plus_usage",
        usage_unit: "api_call",
        usage_price_cents: 0,
      };

    case "credit_based_workflow_app":
      return {
        app_name: app.appName,
        app_slug: app.appSlug,
        revenue_mode: "subscription_plus_usage",
        usage_unit: "workflow_execution",
        usage_price_cents: estimateCreditCost(app),
      };

    case "marketplace_template":
      return {
        app_name: app.appName,
        app_slug: app.appSlug,
        revenue_mode: "subscription_plus_usage",
        usage_unit: "install",
        usage_price_cents: 0,
      };

    case "freemium":
      return {
        app_name: app.appName,
        app_slug: app.appSlug,
        revenue_mode: "subscription_plus_usage",
        usage_unit: "api_call",
        usage_price_cents: 0,
      };

    default:
      return null;
  }
}

// ── API Product Mapper ──────────────────────────────────────────────────────
// Maps to POST /omni/create-api-product

export function mapToApiProduct(app: GeneratedAppMetadata): CreateApiProductRequest | null {
  if (!app.hasApi && app.monetizationMode !== "paid_api_app") {
    return null;
  }

  return {
    app_name: app.appName,
    app_slug: app.appSlug,
    plan_key: selectPlanKey(app.monetizationMode),
    endpoints: ["/api/run"],
  };
}

function selectPlanKey(mode: string): string {
  switch (mode) {
    case "paid_api_app":
      return "starter";
    case "subscription_saas":
    case "subscription_plus_usage":
      return "pro";
    case "credit_based_workflow_app":
      return "starter";
    default:
      return "free";
  }
}

// ── Usage Policy Builder ────────────────────────────────────────────────────

export function buildUsagePolicy(app: GeneratedAppMetadata): UsagePolicy {
  const defaults: Record<string, UsagePolicy> = {
    static_free_app: {
      monetization_mode: "static_free_app",
      metering_enabled: false,
      usage_unit: "pageview",
      usage_price_cents: 0,
      free_tier_limit: 0,
      overage_behavior: "block",
      rate_limit_rpm: 0,
      rate_limit_rpd: 0,
      quota_reset_interval: "monthly",
      webhook_required: false,
      api_key_required: false,
    },
    paid_api_app: {
      monetization_mode: "paid_api_app",
      metering_enabled: true,
      usage_unit: "request",
      usage_price_cents: 1,
      free_tier_limit: 100,
      overage_behavior: "charge",
      rate_limit_rpm: 60,
      rate_limit_rpd: 10000,
      quota_reset_interval: "monthly",
      webhook_required: true,
      api_key_required: true,
    },
    subscription_saas: {
      monetization_mode: "subscription_saas",
      metering_enabled: true,
      usage_unit: "request",
      usage_price_cents: 0,
      free_tier_limit: 500,
      overage_behavior: "degrade",
      rate_limit_rpm: 120,
      rate_limit_rpd: 50000,
      quota_reset_interval: "monthly",
      webhook_required: true,
      api_key_required: false,
    },
    subscription_plus_usage: {
      monetization_mode: "subscription_plus_usage",
      metering_enabled: true,
      usage_unit: "api_call",
      usage_price_cents: 5,
      free_tier_limit: 100,
      overage_behavior: "charge",
      rate_limit_rpm: 120,
      rate_limit_rpd: 50000,
      quota_reset_interval: "monthly",
      webhook_required: true,
      api_key_required: true,
    },
    credit_based_workflow_app: {
      monetization_mode: "credit_based_workflow_app",
      metering_enabled: true,
      usage_unit: "workflow_execution",
      usage_price_cents: 5,
      free_tier_limit: 10,
      overage_behavior: "block",
      rate_limit_rpm: 30,
      rate_limit_rpd: 5000,
      quota_reset_interval: "monthly",
      webhook_required: true,
      api_key_required: true,
    },
    marketplace_template: {
      monetization_mode: "marketplace_template",
      metering_enabled: true,
      usage_unit: "install",
      usage_price_cents: 0,
      free_tier_limit: 0,
      overage_behavior: "block",
      rate_limit_rpm: 10,
      rate_limit_rpd: 1000,
      quota_reset_interval: "monthly",
      webhook_required: false,
      api_key_required: false,
    },
    freemium: {
      monetization_mode: "freemium",
      metering_enabled: true,
      usage_unit: "api_call",
      usage_price_cents: 0,
      free_tier_limit: 100,
      overage_behavior: "degrade",
      rate_limit_rpm: 60,
      rate_limit_rpd: 10000,
      quota_reset_interval: "monthly",
      webhook_required: false,
      api_key_required: false,
    },
  };

  return defaults[app.monetizationMode] ?? defaults.subscription_plus_usage;
}

// ── Generated App Billing Env ───────────────────────────────────────────────

export function buildBillingEnvExample(app: GeneratedAppMetadata): GeneratedAppBillingEnv {
  return {
    CASH_SAAS_CORE_URL: "",
    CASH_SAAS_ORG_ID: "",
    CASH_SAAS_PRODUCT_ID: app.appId || "",
    CASH_SAAS_API_KEY: "",
    CASH_SAAS_REVENUE_MODE: app.monetizationMode,
    CASH_SAAS_USAGE_UNIT:
      app.monetizationMode === "credit_based_workflow_app" ? "workflow_execution" : "api_call",
    CASH_SAAS_USAGE_PRICE_CENTS:
      app.monetizationMode === "paid_api_app" ? "5" : app.monetizationMode === "credit_based_workflow_app" ? "5" : "0",
    STRIPE_PRICE_ID: "",
    PUBLIC_APP_URL: "",
  };
}

// ── Deployment Checklist ────────────────────────────────────────────────────

export interface DeploymentChecklistItem {
  step: number;
  action: string;
  required: boolean;
  completed: boolean;
  details: string;
}

export function buildDeploymentChecklist(app: GeneratedAppMetadata): DeploymentChecklistItem[] {
  const items: DeploymentChecklistItem[] = [
    {
      step: 1,
      action: "Register app with cash-saas-core-v2",
      required: app.monetizationMode !== "static_free_app",
      completed: Boolean(app.appId),
      details: "POST /omni/register-generated-app",
    },
    {
      step: 2,
      action: "Create billing profile",
      required: ["paid_api_app", "subscription_saas", "subscription_plus_usage", "credit_based_workflow_app"].includes(app.monetizationMode),
      completed: false,
      details: "POST /omni/create-billing-profile",
    },
    {
      step: 3,
      action: "Create API product",
      required: app.hasApi || app.monetizationMode === "paid_api_app",
      completed: false,
      details: "POST /omni/create-api-product",
    },
    {
      step: 4,
      action: "Configure Stripe price ID",
      required: ["subscription_saas", "subscription_plus_usage", "paid_api_app"].includes(app.monetizationMode),
      completed: false,
      details: "Create Stripe product and price in dashboard",
    },
    {
      step: 5,
      action: "Set billing environment variables",
      required: app.monetizationMode !== "static_free_app",
      completed: false,
      details: "Set CASH_SAAS_* and STRIPE_* env vars in deployment",
    },
    {
      step: 6,
      action: "Configure webhook endpoint",
      required: ["paid_api_app", "subscription_saas", "subscription_plus_usage", "credit_based_workflow_app"].includes(app.monetizationMode),
      completed: false,
      details: "Set Stripe webhook URL to point to deployed app",
    },
    {
      step: 7,
      action: "Verify TemplateForge validation",
      required: true,
      completed: false,
      details: "Run TemplateForge validation on the generated app package",
    },
    {
      step: 8,
      action: "Deploy application",
      required: true,
      completed: false,
      details: "Push to GitHub and deploy via Vercel/target platform",
    },
  ];

  return items.filter((item) => item.required);
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function estimateCreditCost(app: GeneratedAppMetadata): number {
  let baseCost = 1;
  if (app.features.includes("ai_generation")) baseCost += 5;
  if (app.features.includes("ai_vision")) baseCost += 10;
  if (app.features.includes("data_transform")) baseCost += 2;
  if (app.features.includes("export")) baseCost += 1;
  return baseCost;
}
