/**
 * CashSaasConnector — connects Omni-Forge Phase 3 to cash-saas-core-v2 backend.
 *
 * Endpoint map (cash-saas-core-v2):
 *   GET  /omni/platform-capabilities   → platform info, plans, features
 *   POST /omni/register-generated-app  → register a generated app (requires auth)
 *   POST /omni/create-billing-profile  → get billing config for an app
 *   POST /omni/create-api-product      → create API product entry
 *
 * Environment variables:
 *   CASH_SAAS_CORE_URL        — Base URL of cash-saas-core-v2 (e.g. http://localhost:8000)
 *   CASH_SAAS_ADMIN_API_KEY   — JWT Bearer token for authenticated endpoints
 *
 * When both env vars are set, the integration is automatically enabled.
 * When either is missing, all functions return safe disabled-mode responses.
 */

export interface CashSaasConfig {
  baseUrl: string;
  adminToken: string;
  enabled: boolean;
}

export interface CashSaasCapabilities {
  platform: string;
  positioning: string;
  features: string[];
  plans: Record<string, unknown>;
  default_routes: string[];
}

export interface CashSaasBillingProfile {
  recommended_env_vars: string[];
  route_map: Record<string, string>;
  billing_config: {
    revenue_mode: string;
    free_quota: number;
    paid_plan: string;
    usage_unit: string;
    usage_price_cents: number;
    checkout_enabled: boolean;
    webhook_enabled: boolean;
    api_key_required: boolean;
  };
  usage_config: {
    meter: string;
    cost_cents: number;
  };
  deployment_checklist: string[];
}

export interface RegisteredApp {
  id: number;
  app_name: string;
  app_slug: string;
  organization_id: number;
  revenue_mode: string;
  billing_profile: CashSaasBillingProfile;
}

export interface CashSaasStatus {
  connected: boolean;
  platform: string | null;
  features: string[];
  plans: string[];
  error: string | null;
}

function getConfig(): CashSaasConfig {
  const baseUrl = (process.env.CASH_SAAS_CORE_URL || "").replace(/\/$/, "");
  const adminToken = process.env.CASH_SAAS_ADMIN_API_KEY || "";
  const enabled = Boolean(baseUrl && adminToken);
  return { baseUrl, adminToken, enabled };
}

function authHeaders(token: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    "X-Source": "omni-forge",
  };
}

export async function getCashSaasStatus(): Promise<CashSaasStatus> {
  const config = getConfig();

  if (!config.enabled) {
    return {
      connected: false,
      platform: null,
      features: [],
      plans: [],
      error:
        "Cash SaaS integration is disabled. Set CASH_SAAS_CORE_URL and CASH_SAAS_ADMIN_API_KEY in your environment.",
    };
  }

  try {
    const res = await fetch(`${config.baseUrl}/omni/platform-capabilities`, {
      headers: authHeaders(config.adminToken),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return {
        connected: false,
        platform: null,
        features: [],
        plans: [],
        error: `Cash SaaS returned ${res.status}: ${res.statusText}`,
      };
    }

    const caps: CashSaasCapabilities = await res.json();
    return {
      connected: true,
      platform: caps.platform,
      features: caps.features,
      plans: Object.keys(caps.plans),
      error: null,
    };
  } catch (err) {
    return {
      connected: false,
      platform: null,
      features: [],
      plans: [],
      error: `Connection failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

export async function registerApp(params: {
  organizationId: number;
  appName: string;
  appSlug: string;
  revenueMode?: string;
  freeQuota?: number;
  paidPlan?: string;
  usageUnit?: string;
  usagePriceCents?: number;
}): Promise<RegisteredApp | null> {
  const config = getConfig();
  if (!config.enabled) return null;

  try {
    const res = await fetch(`${config.baseUrl}/omni/register-generated-app`, {
      method: "POST",
      headers: authHeaders(config.adminToken),
      body: JSON.stringify({
        organization_id: params.organizationId,
        app_name: params.appName,
        app_slug: params.appSlug,
        revenue_mode: params.revenueMode || "subscription_plus_usage",
        free_quota: params.freeQuota || 100,
        paid_plan: params.paidPlan || "starter",
        usage_unit: params.usageUnit || "api_call",
        usage_price_cents: params.usagePriceCents || 5,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function getBillingProfile(params: {
  appName: string;
  appSlug: string;
  revenueMode?: string;
  usageUnit?: string;
  usagePriceCents?: number;
}): Promise<CashSaasBillingProfile | null> {
  const config = getConfig();
  if (!config.enabled) return null;

  try {
    const res = await fetch(`${config.baseUrl}/omni/create-billing-profile`, {
      method: "POST",
      headers: authHeaders(config.adminToken),
      body: JSON.stringify({
        app_name: params.appName,
        app_slug: params.appSlug,
        revenue_mode: params.revenueMode || "subscription_plus_usage",
        usage_unit: params.usageUnit || "api_call",
        usage_price_cents: params.usagePriceCents || 5,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function createApiProduct(params: {
  appName: string;
  appSlug: string;
  planKey?: string;
  endpoints?: string[];
}): Promise<Record<string, unknown> | null> {
  const config = getConfig();
  if (!config.enabled) return null;

  try {
    const res = await fetch(`${config.baseUrl}/omni/create-api-product`, {
      method: "POST",
      headers: authHeaders(config.adminToken),
      body: JSON.stringify({
        app_name: params.appName,
        app_slug: params.appSlug,
        plan_key: params.planKey || "starter",
        endpoints: params.endpoints || ["/api/run"],
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export function generateCashSaasEnvBlock(slug: string): string {
  return `# ── Cash SaaS Core V2 (monetization backend) ──
CASH_SAAS_CORE_URL=http://localhost:8000
CASH_SAAS_ADMIN_API_KEY=
CASH_SAAS_APP_SLUG=${slug}
`;
}

export function getCashSaasDeploymentChecklist(): string[] {
  return [
    "Deploy cash-saas-core-v2 (docker compose up -d)",
    "Run Alembic migrations (alembic upgrade head)",
    "Seed admin user (python scripts/seed_demo_data.py)",
    "Configure Stripe products and prices",
    "Set Stripe webhook endpoint to /stripe/webhook",
    "Create organization and API keys",
    "Set CASH_SAAS_CORE_URL in Omni-Forge environment",
    "Set CASH_SAAS_ADMIN_API_KEY with valid JWT token",
    "Verify /health and /metrics endpoints respond",
  ];
}
