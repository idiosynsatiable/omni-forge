/**
 * CashSaasConnector — server-to-server client for the canonical monetization
 * authority. User-scoped mutations forward the caller's current bearer token;
 * Omni does not store a second long-lived admin JWT universe.
 */

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

function baseUrl(): string {
  const value = (process.env.CASH_SAAS_CORE_URL || "").replace(/\/$/, "");
  if (!value) return "";
  const parsed = new URL(value);
  if (process.env.NODE_ENV === "production" && parsed.protocol !== "https:") {
    throw new Error("CASH_SAAS_CORE_URL must use https in production");
  }
  return value;
}

function headers(token?: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Source": "omni-forge",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function safeJson<T>(response: Response): Promise<T | null> {
  if (!response.ok) return null;
  try {
    return await response.json() as T;
  } catch {
    return null;
  }
}

export async function getCashSaasStatus(): Promise<CashSaasStatus> {
  let url: string;
  try {
    url = baseUrl();
  } catch (error) {
    return {
      connected: false,
      platform: null,
      features: [],
      plans: [],
      error: error instanceof Error ? error.message : "Invalid Cash-SaaS URL",
    };
  }

  if (!url) {
    return {
      connected: false,
      platform: null,
      features: [],
      plans: [],
      error: "Cash-SaaS integration is disabled. Set CASH_SAAS_CORE_URL.",
    };
  }

  try {
    const res = await fetch(`${url}/omni/platform-capabilities`, {
      headers: headers(),
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    const caps = await safeJson<CashSaasCapabilities>(res);
    if (!caps) {
      return {
        connected: false,
        platform: null,
        features: [],
        plans: [],
        error: `Cash-SaaS capability probe returned HTTP ${res.status}`,
      };
    }
    return {
      connected: true,
      platform: caps.platform,
      features: caps.features,
      plans: Object.keys(caps.plans),
      error: null,
    };
  } catch (error) {
    return {
      connected: false,
      platform: null,
      features: [],
      plans: [],
      error: error instanceof Error && error.name === "TimeoutError"
        ? "Cash-SaaS capability probe timed out"
        : "Cash-SaaS capability probe failed",
    };
  }
}

export async function registerApp(params: {
  organizationId: number;
  appName: string;
  appSlug: string;
  accessToken: string;
  revenueMode?: string;
  freeQuota?: number;
  paidPlan?: string;
  usageUnit?: string;
  usagePriceCents?: number;
}): Promise<RegisteredApp | null> {
  const url = baseUrl();
  if (!url || !params.accessToken) return null;

  try {
    const res = await fetch(`${url}/omni/register-generated-app`, {
      method: "POST",
      headers: headers(params.accessToken),
      body: JSON.stringify({
        organization_id: params.organizationId,
        app_name: params.appName,
        app_slug: params.appSlug,
        revenue_mode: params.revenueMode || "subscription",
        free_quota: params.freeQuota || 100,
        paid_plan: params.paidPlan || "starter",
        usage_unit: params.usageUnit || "api_call",
        usage_price_cents: params.usagePriceCents || 5,
      }),
      signal: AbortSignal.timeout(10000),
    });
    return await safeJson<RegisteredApp>(res);
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
  const url = baseUrl();
  if (!url) return null;
  try {
    const res = await fetch(`${url}/omni/create-billing-profile`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        app_name: params.appName,
        app_slug: params.appSlug,
        revenue_mode: params.revenueMode || "subscription",
        usage_unit: params.usageUnit || "api_call",
        usage_price_cents: params.usagePriceCents || 5,
      }),
      signal: AbortSignal.timeout(10000),
    });
    return await safeJson<CashSaasBillingProfile>(res);
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
  const url = baseUrl();
  if (!url) return null;
  try {
    const res = await fetch(`${url}/omni/create-api-product`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        app_name: params.appName,
        app_slug: params.appSlug,
        plan_key: params.planKey || "starter",
        endpoints: params.endpoints || ["/api/run"],
      }),
      signal: AbortSignal.timeout(10000),
    });
    return await safeJson<Record<string, unknown>>(res);
  } catch {
    return null;
  }
}

export function generateCashSaasEnvBlock(slug: string): string {
  return `# ── Cash-SaaS Core (monetization authority) ──
CASH_SAAS_CORE_URL=http://localhost:8000
CASH_SAAS_APP_SLUG=${slug}
`;
}

export function getCashSaasDeploymentChecklist(): string[] {
  return [
    "Deploy Cash-SaaS Core with PostgreSQL",
    "Run committed Alembic migrations",
    "Configure Stripe products, prices, and signed webhook endpoint",
    "Create/verify organization membership",
    "Set CASH_SAAS_CORE_URL in Omni-Forge",
    "Do not configure a static Cash-SaaS admin JWT in Omni-Forge",
    "Verify /health and current /auth/me organization authority",
  ];
}
