// ============================================================================
// Revenue Spine Types — Omni-Forge Phase 3.5
// Type definitions matching cash-saas-core-v2 actual API responses
// ============================================================================

import { z } from "zod";

// ── Monetization Modes ──────────────────────────────────────────────────────

export const MonetizationMode = z.enum([
  "static_free_app",
  "paid_api_app",
  "subscription_saas",
  "subscription_plus_usage",
  "credit_based_workflow_app",
  "marketplace_template",
  "freemium",
]);
export type MonetizationMode = z.infer<typeof MonetizationMode>;

// ── Platform Capabilities Response ──────────────────────────────────────────
// Matches GET /omni/platform-capabilities from cash-saas-core-v2

export const PlanSchema = z.object({
  key: z.string(),
  name: z.string(),
  price_monthly: z.number(),
  monthly_quota: z.number(),
  api_keys: z.number(),
  team_members: z.number(),
  priority_rate_limit: z.boolean(),
  omni_hooks: z.boolean(),
});

export const PlatformCapabilitiesSchema = z.object({
  platform: z.string(),
  positioning: z.string(),
  features: z.array(z.string()),
  plans: z.record(PlanSchema),
  default_routes: z.array(z.string()),
});
export type PlatformCapabilities = z.infer<typeof PlatformCapabilitiesSchema>;

// ── Register Generated App ──────────────────────────────────────────────────
// Matches POST /omni/register-generated-app from cash-saas-core-v2

export const RegisterAppRequestSchema = z.object({
  organization_id: z.number().int(),
  app_name: z.string().min(1).max(255),
  app_slug: z.string().regex(/^[a-z0-9-]+$/).max(100),
  revenue_mode: z.string().default("subscription_plus_usage"),
  free_quota: z.number().int().min(0).default(100),
  paid_plan: z.string().default("starter"),
  usage_unit: z.string().default("api_call"),
  usage_price_cents: z.number().int().min(0).default(5),
});
export type RegisterAppRequest = z.infer<typeof RegisterAppRequestSchema>;

export const BillingConfigSchema = z.object({
  revenue_mode: z.string(),
  free_quota: z.number(),
  paid_plan: z.string(),
  usage_unit: z.string(),
  usage_price_cents: z.number(),
  checkout_enabled: z.boolean(),
  webhook_enabled: z.boolean(),
  api_key_required: z.boolean(),
});

export const RegisterAppResponseSchema = z.object({
  id: z.number(),
  recommended_env_vars: z.array(z.string()),
  route_map: z.record(z.string()),
  billing_config: BillingConfigSchema,
  usage_config: z.object({
    meter: z.string(),
    cost_cents: z.number(),
  }),
  deployment_checklist: z.array(z.string()),
});
export type RegisterAppResponse = z.infer<typeof RegisterAppResponseSchema>;

// ── Billing Profile ─────────────────────────────────────────────────────────
// Matches POST /omni/create-billing-profile from cash-saas-core-v2

export const CreateBillingProfileRequestSchema = z.object({
  app_name: z.string().min(1).max(255),
  app_slug: z.string().regex(/^[a-z0-9-]+$/).max(100),
  revenue_mode: z.string().default("subscription_plus_usage"),
  usage_unit: z.string().default("api_call"),
  usage_price_cents: z.number().int().min(0).default(5),
});
export type CreateBillingProfileRequest = z.infer<typeof CreateBillingProfileRequestSchema>;

export const BillingProfileResponseSchema = z.object({
  recommended_env_vars: z.array(z.string()),
  route_map: z.record(z.string()),
  billing_config: BillingConfigSchema,
  usage_config: z.object({
    meter: z.string(),
    cost_cents: z.number(),
  }),
  deployment_checklist: z.array(z.string()),
});
export type BillingProfileResponse = z.infer<typeof BillingProfileResponseSchema>;

// ── API Product ─────────────────────────────────────────────────────────────
// Matches POST /omni/create-api-product from cash-saas-core-v2

export const CreateApiProductRequestSchema = z.object({
  app_name: z.string().min(1).max(255),
  app_slug: z.string().regex(/^[a-z0-9-]+$/).max(100),
  plan_key: z.string().default("starter"),
  endpoints: z.array(z.string()).default(["/api/run"]),
});
export type CreateApiProductRequest = z.infer<typeof CreateApiProductRequestSchema>;

export const ApiProductResponseSchema = z.object({
  app_name: z.string(),
  app_slug: z.string(),
  plan_key: z.string(),
  endpoints: z.array(z.string()),
  required_headers: z.array(z.string()),
  usage_meter: z.string(),
  recommended_docs_path: z.string(),
});
export type ApiProductResponse = z.infer<typeof ApiProductResponseSchema>;

// ── Usage Policy ────────────────────────────────────────────────────────────

export const UsagePolicySchema = z.object({
  monetization_mode: z.string(),
  metering_enabled: z.boolean(),
  usage_unit: z.string(),
  usage_price_cents: z.number().int().min(0),
  free_tier_limit: z.number().int().min(0),
  overage_behavior: z.enum(["block", "charge", "degrade"]),
  rate_limit_rpm: z.number().int().min(0),
  rate_limit_rpd: z.number().int().min(0),
  quota_reset_interval: z.enum(["hourly", "daily", "monthly"]),
  webhook_required: z.boolean(),
  api_key_required: z.boolean(),
});
export type UsagePolicy = z.infer<typeof UsagePolicySchema>;

// ── Revenue Spine Health ────────────────────────────────────────────────────

export const RevenueSpineHealthSchema = z.object({
  enabled: z.boolean(),
  cash_saas_core_url: z.string().nullable(),
  platform_reachable: z.boolean(),
  stripe_mode: z.enum(["test", "live", "disabled", "unknown"]),
  capabilities: PlatformCapabilitiesSchema.nullable(),
  last_sync_at: z.string().nullable(),
  last_sync_status: z.enum(["success", "failed", "never"]),
  errors: z.array(z.string()),
});
export type RevenueSpineHealth = z.infer<typeof RevenueSpineHealthSchema>;

// ── Deployment Readiness ────────────────────────────────────────────────────

export interface DeploymentReadinessScore {
  overall_score: number;
  categories: {
    revenue_spine_health: number;
    billing_profile_sync: number;
    api_product_sync: number;
    webhook_readiness: number;
    usage_metering_readiness: number;
    api_key_enforcement_readiness: number;
    generated_env_completeness: number;
    templateforge_validation_score: number;
  };
  passing: boolean;
  blockers: string[];
  warnings: string[];
}

// ── Sync Result ─────────────────────────────────────────────────────────────

export interface SyncResult {
  success: boolean;
  action: string;
  timestamp: string;
  details: Record<string, unknown>;
  error?: string;
}

// ── Generated App Billing Env ───────────────────────────────────────────────

export interface GeneratedAppBillingEnv {
  CASH_SAAS_CORE_URL: string;
  CASH_SAAS_ORG_ID: string;
  CASH_SAAS_PRODUCT_ID: string;
  CASH_SAAS_API_KEY: string;
  CASH_SAAS_REVENUE_MODE: string;
  CASH_SAAS_USAGE_UNIT: string;
  CASH_SAAS_USAGE_PRICE_CENTS: string;
  STRIPE_PRICE_ID: string;
  PUBLIC_APP_URL: string;
}
