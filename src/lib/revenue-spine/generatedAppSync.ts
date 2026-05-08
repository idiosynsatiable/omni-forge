// ============================================================================
// Generated App Sync — Omni-Forge Phase 3.5
// Orchestrates the full sync flow: register app → create billing profile →
// create API product → generate env → generate checklist.
// Aligned with cash-saas-core-v2 real /omni/* endpoints.
// ============================================================================

import { getCashSaasClient } from "./cashSaasClient";
import {
  mapToBillingProfile,
  mapToApiProduct,
  buildUsagePolicy,
  buildBillingEnvExample,
  buildDeploymentChecklist,
  type GeneratedAppMetadata,
  type DeploymentChecklistItem,
} from "./billingProfileMapper";
import type {
  RegisterAppResponse,
  BillingProfileResponse,
  ApiProductResponse,
  UsagePolicy,
  GeneratedAppBillingEnv,
  SyncResult,
} from "./revenueSpineTypes";

// ── Sync Orchestration ──────────────────────────────────────────────────────

export interface FullSyncResult {
  success: boolean;
  appRegistration: SyncResult;
  billingProfile: SyncResult;
  apiProduct: SyncResult;
  usagePolicy: UsagePolicy;
  billingEnv: GeneratedAppBillingEnv;
  deploymentChecklist: DeploymentChecklistItem[];
  stripeReadiness: StripeReadinessState;
  cashSaasRouteMap: CashSaasRouteMap;
  errors: string[];
}

export interface StripeReadinessState {
  mode: "test" | "live" | "disabled" | "unknown";
  productsConfigured: boolean;
  webhookConfigured: boolean;
  checkoutReady: boolean;
  billingPortalReady: boolean;
}

export interface CashSaasRouteMap {
  registerApp: string;
  createBillingProfile: string;
  createApiProduct: string;
  platformCapabilities: string;
  health: string;
}

// ── Main Sync Function ──────────────────────────────────────────────────────

export async function syncGeneratedApp(app: GeneratedAppMetadata): Promise<FullSyncResult> {
  const client = getCashSaasClient();
  const errors: string[] = [];
  const timestamp = new Date().toISOString();

  // Build static outputs first (no network calls)
  const usagePolicy = buildUsagePolicy(app);
  const billingEnv = buildBillingEnvExample(app);
  const deploymentChecklist = buildDeploymentChecklist(app);
  const cashSaasRouteMap = buildCashSaasRouteMap(client.baseUrl);

  // Initialize sync results
  let appSyncResult: SyncResult = { success: false, action: "register_app", timestamp, details: {} };
  let billingSyncResult: SyncResult = { success: false, action: "create_billing_profile", timestamp, details: {} };
  let apiProductSyncResult: SyncResult = { success: false, action: "create_api_product", timestamp, details: {} };
  let stripeReadiness: StripeReadinessState = {
    mode: "unknown",
    productsConfigured: false,
    webhookConfigured: false,
    checkoutReady: false,
    billingPortalReady: false,
  };

  // Skip network calls for free apps
  if (app.monetizationMode === "static_free_app") {
    return {
      success: true,
      appRegistration: {
        success: true, action: "register_app", timestamp,
        details: { skipped: true, reason: "static_free_app does not require registration" },
      },
      billingProfile: {
        success: true, action: "create_billing_profile", timestamp,
        details: { skipped: true, reason: "static_free_app does not require billing" },
      },
      apiProduct: {
        success: true, action: "create_api_product", timestamp,
        details: { skipped: true, reason: "static_free_app does not require API product" },
      },
      usagePolicy,
      billingEnv,
      deploymentChecklist,
      stripeReadiness: { ...stripeReadiness, mode: "disabled" },
      cashSaasRouteMap,
      errors,
    };
  }

  // Check if revenue spine is enabled
  if (!client.isEnabled) {
    const reason = "Revenue spine disabled — CASH_SAAS_CORE_URL or CASH_SAAS_ADMIN_API_KEY not set";
    errors.push(reason);
    appSyncResult.error = reason;
    billingSyncResult.error = reason;
    apiProductSyncResult.error = reason;

    return {
      success: false,
      appRegistration: appSyncResult,
      billingProfile: billingSyncResult,
      apiProduct: apiProductSyncResult,
      usagePolicy,
      billingEnv,
      deploymentChecklist,
      stripeReadiness,
      cashSaasRouteMap,
      errors,
    };
  }

  // Step 1: Check platform capabilities to determine Stripe readiness
  const capResult = await client.getPlatformCapabilities();
  if (capResult.success && capResult.data) {
    const features = capResult.data.features;
    const hasStripe = features.includes("stripe_checkout");
    stripeReadiness.checkoutReady = hasStripe;
    stripeReadiness.billingPortalReady = features.includes("billing_portal");
    stripeReadiness.webhookConfigured = hasStripe; // assumed if stripe_checkout is listed
    stripeReadiness.productsConfigured = hasStripe;
    stripeReadiness.mode = hasStripe ? "disabled" : "disabled"; // actual mode unknown without direct Stripe query
  }

  // Step 2: Create billing profile (doesn't require auth)
  const billingProfileRequest = mapToBillingProfile(app);
  if (billingProfileRequest) {
    const bpResult = await client.createBillingProfile(billingProfileRequest);
    if (bpResult.success && bpResult.data) {
      billingSyncResult = {
        success: true,
        action: "create_billing_profile",
        timestamp,
        details: {
          revenue_mode: bpResult.data.billing_config.revenue_mode,
          usage_unit: bpResult.data.billing_config.usage_unit,
          usage_price_cents: bpResult.data.billing_config.usage_price_cents,
          route_map: bpResult.data.route_map,
        },
      };
    } else {
      const err = bpResult.enabled === false ? bpResult.reason : (bpResult as any).error;
      errors.push(`Billing profile creation failed: ${err}`);
      billingSyncResult.error = err;
    }
  } else {
    billingSyncResult = {
      success: true,
      action: "create_billing_profile",
      timestamp,
      details: { skipped: true, reason: "Not required for this monetization mode" },
    };
  }

  // Step 3: Create API product (doesn't require auth)
  const apiProductRequest = mapToApiProduct(app);
  if (apiProductRequest) {
    const apResult = await client.createApiProduct(apiProductRequest);
    if (apResult.success && apResult.data) {
      apiProductSyncResult = {
        success: true,
        action: "create_api_product",
        timestamp,
        details: {
          app_slug: apResult.data.app_slug,
          plan_key: apResult.data.plan_key,
          endpoints: apResult.data.endpoints,
          usage_meter: apResult.data.usage_meter,
        },
      };
    } else {
      const err = apResult.enabled === false ? apResult.reason : (apResult as any).error;
      errors.push(`API product creation failed: ${err}`);
      apiProductSyncResult.error = err;
    }
  } else {
    apiProductSyncResult = {
      success: true,
      action: "create_api_product",
      timestamp,
      details: { skipped: true, reason: "Not required for this monetization mode" },
    };
  }

  // Step 4: Register app (requires auth) — note: this is the main registration
  // that creates a record in the database, requiring org membership
  const registerResult = await client.registerGeneratedApp({
    organization_id: 1, // Default org, will be overridden in production
    app_name: app.appName,
    app_slug: app.appSlug,
    revenue_mode: app.monetizationMode === "paid_api_app" ? "subscription_plus_usage" : (app.monetizationMode || "subscription_plus_usage"),
    free_quota: 100,
    paid_plan: "starter",
    usage_unit: "api_call",
    usage_price_cents: 5,
  });

  if (registerResult.success && registerResult.data) {
    app.appId = String(registerResult.data.id);
    appSyncResult = {
      success: true,
      action: "register_app",
      timestamp,
      details: { app_id: registerResult.data.id },
    };
    billingEnv.CASH_SAAS_PRODUCT_ID = String(registerResult.data.id);
  } else {
    const err = registerResult.enabled === false ? registerResult.reason : (registerResult as any).error;
    errors.push(`App registration failed: ${err}`);
    appSyncResult.error = err;
  }

  const overallSuccess = billingSyncResult.success && apiProductSyncResult.success;

  return {
    success: overallSuccess,
    appRegistration: appSyncResult,
    billingProfile: billingSyncResult,
    apiProduct: apiProductSyncResult,
    usagePolicy,
    billingEnv,
    deploymentChecklist,
    stripeReadiness,
    cashSaasRouteMap,
    errors,
  };
}

// ── Route Map Builder ───────────────────────────────────────────────────────

function buildCashSaasRouteMap(baseUrl: string): CashSaasRouteMap {
  const base = baseUrl || "https://api.builderos.ai";
  return {
    registerApp: `${base}/omni/register-generated-app`,
    createBillingProfile: `${base}/omni/create-billing-profile`,
    createApiProduct: `${base}/omni/create-api-product`,
    platformCapabilities: `${base}/omni/platform-capabilities`,
    health: `${base}/health`,
  };
}
