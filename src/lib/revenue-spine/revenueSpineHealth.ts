// ============================================================================
// Revenue Spine Health — Omni-Forge Phase 3.5
// Checks the health of the revenue spine connection and returns a
// structured health report. Used by the API endpoint, dashboard panel,
// CLI doctor command, and deployment readiness scoring.
// ============================================================================

import { getCashSaasClient } from "./cashSaasClient";
import type {
  RevenueSpineHealth,
  DeploymentReadinessScore,
  PlatformCapabilities,
} from "./revenueSpineTypes";

// ── State Tracking ──────────────────────────────────────────────────────────

let _lastSyncAt: string | null = null;
let _lastSyncStatus: "success" | "failed" | "never" = "never";

export function recordSyncResult(success: boolean): void {
  _lastSyncAt = new Date().toISOString();
  _lastSyncStatus = success ? "success" : "failed";
}

export function getLastSyncInfo(): { at: string | null; status: "success" | "failed" | "never" } {
  return { at: _lastSyncAt, status: _lastSyncStatus };
}

// ── Derive stripe mode from capabilities features ───────────────────────────

function deriveStripeMode(caps: PlatformCapabilities): "test" | "live" | "disabled" {
  if (caps.features.includes("stripe_checkout")) {
    // If stripe_checkout is listed as a feature, the backend supports it
    // but we can't tell test vs live without a Stripe endpoint — default to "disabled"
    // until Stripe keys are actually configured in cash-saas
    return "disabled";
  }
  return "disabled";
}

// ── Health Check ────────────────────────────────────────────────────────────

export async function checkRevenueSpineHealth(): Promise<RevenueSpineHealth> {
  const client = getCashSaasClient();
  const errors: string[] = [];
  const syncInfo = getLastSyncInfo();

  if (!client.isEnabled) {
    return {
      enabled: false,
      cash_saas_core_url: null,
      platform_reachable: false,
      stripe_mode: "disabled",
      capabilities: null,
      last_sync_at: syncInfo.at,
      last_sync_status: syncInfo.status,
      errors: ["Revenue spine disabled: CASH_SAAS_CORE_URL or CASH_SAAS_ADMIN_API_KEY not configured"],
    };
  }

  // Try to reach platform capabilities
  const capResult = await client.getPlatformCapabilities();

  if (capResult.success && capResult.data) {
    const stripeMode = deriveStripeMode(capResult.data);
    return {
      enabled: true,
      cash_saas_core_url: client.baseUrl,
      platform_reachable: true,
      stripe_mode: stripeMode,
      capabilities: capResult.data,
      last_sync_at: syncInfo.at,
      last_sync_status: syncInfo.status,
      errors: [],
    };
  }

  // Platform unreachable
  const errorMsg = capResult.enabled === false
    ? capResult.reason
    : (capResult as any).error || "Unknown error";
  errors.push(errorMsg);

  return {
    enabled: true,
    cash_saas_core_url: client.baseUrl,
    platform_reachable: false,
    stripe_mode: "unknown",
    capabilities: null,
    last_sync_at: syncInfo.at,
    last_sync_status: syncInfo.status,
    errors,
  };
}

// ── Deployment Readiness Scoring ────────────────────────────────────────────

export interface ReadinessInput {
  revenueSpineHealth: RevenueSpineHealth;
  hasBillingProfile: boolean;
  hasApiProduct: boolean;
  hasWebhookEndpoint: boolean;
  hasUsageMeteringConfig: boolean;
  hasApiKeyEnforcement: boolean;
  envCompleteness: number; // 0.0 to 1.0
  templateForgeScore: number; // 0.0 to 1.0
}

export function calculateDeploymentReadiness(input: ReadinessInput): DeploymentReadinessScore {
  const blockers: string[] = [];
  const warnings: string[] = [];

  const categories = {
    revenue_spine_health: scoreRevenueSpine(input.revenueSpineHealth, blockers, warnings),
    billing_profile_sync: input.hasBillingProfile ? 100 : (blockers.push("No billing profile synced"), 0),
    api_product_sync: input.hasApiProduct ? 100 : (warnings.push("No API product synced"), 50),
    webhook_readiness: input.hasWebhookEndpoint ? 100 : (blockers.push("Webhook endpoint not configured"), 0),
    usage_metering_readiness: input.hasUsageMeteringConfig ? 100 : (warnings.push("Usage metering not configured"), 30),
    api_key_enforcement_readiness: input.hasApiKeyEnforcement ? 100 : (warnings.push("API key enforcement not active"), 50),
    generated_env_completeness: Math.round(input.envCompleteness * 100),
    templateforge_validation_score: Math.round(input.templateForgeScore * 100),
  };

  if (input.envCompleteness < 0.8) {
    blockers.push(`Environment variables only ${Math.round(input.envCompleteness * 100)}% complete`);
  }
  if (input.templateForgeScore < 0.7) {
    blockers.push(`TemplateForge validation score too low: ${Math.round(input.templateForgeScore * 100)}%`);
  }

  const values = Object.values(categories);
  const overall_score = Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
  const passing = overall_score >= 70 && blockers.length === 0;

  return {
    overall_score,
    categories,
    passing,
    blockers,
    warnings,
  };
}

function scoreRevenueSpine(
  health: RevenueSpineHealth,
  blockers: string[],
  warnings: string[],
): number {
  if (!health.enabled) {
    blockers.push("Revenue spine disabled");
    return 0;
  }
  if (!health.platform_reachable) {
    blockers.push("cash-saas-core-v2 platform unreachable");
    return 10;
  }
  if (health.stripe_mode === "disabled") {
    warnings.push("Stripe is in disabled mode — configure keys for billing");
    return 60;
  }
  if (health.stripe_mode === "test") {
    warnings.push("Stripe is in test mode — switch to live for production");
    return 80;
  }
  return 100;
}

// ── CLI Doctor Output ───────────────────────────────────────────────────────

export async function generateDoctorReport(): Promise<string> {
  const health = await checkRevenueSpineHealth();
  const lines: string[] = [];

  lines.push("╔══════════════════════════════════════════════════════╗");
  lines.push("║        OMNI-FORGE REVENUE SPINE DOCTOR              ║");
  lines.push("╚══════════════════════════════════════════════════════╝");
  lines.push("");

  // Status
  lines.push(`  Status:              ${health.enabled ? "✅ ENABLED" : "⚠️  DISABLED"}`);
  lines.push(`  cash-saas-core URL:  ${health.cash_saas_core_url ?? "(not configured)"}`);
  lines.push(`  Platform reachable:  ${health.platform_reachable ? "✅ YES" : "❌ NO"}`);
  lines.push(`  Stripe mode:         ${health.stripe_mode}`);
  lines.push("");

  // Capabilities
  if (health.capabilities) {
    lines.push("  Platform Capabilities:");
    lines.push(`    Platform:          ${health.capabilities.platform}`);
    lines.push(`    Features:          ${health.capabilities.features.join(", ")}`);
    lines.push(`    Plans:             ${Object.keys(health.capabilities.plans).join(", ")}`);
    lines.push(`    Default Routes:    ${health.capabilities.default_routes.length}`);
    lines.push("");
  }

  // Sync info
  lines.push(`  Last sync:           ${health.last_sync_at ?? "never"}`);
  lines.push(`  Last sync status:    ${health.last_sync_status}`);
  lines.push("");

  // Omni endpoint availability
  if (health.enabled && health.cash_saas_core_url) {
    lines.push("  Omni Endpoints:");
    lines.push(`    GET  /omni/platform-capabilities    ${health.platform_reachable ? "✅" : "❌"}`);
    lines.push(`    POST /omni/register-generated-app   ${health.platform_reachable ? "✅ (expected)" : "❌"}`);
    lines.push(`    POST /omni/create-billing-profile   ${health.platform_reachable ? "✅ (expected)" : "❌"}`);
    lines.push(`    POST /omni/create-api-product       ${health.platform_reachable ? "✅ (expected)" : "❌"}`);
    lines.push("");
  }

  // Errors
  if (health.errors.length > 0) {
    lines.push("  ⚠ Issues Found:");
    for (const err of health.errors) {
      lines.push(`    • ${err}`);
    }
    lines.push("");
  }

  // Recommendations
  lines.push("  Recommendations:");
  if (!health.enabled) {
    lines.push("    1. Set CASH_SAAS_CORE_URL environment variable");
    lines.push("    2. Set CASH_SAAS_ADMIN_API_KEY environment variable");
    lines.push("    3. Re-run: omni revenue-spine doctor");
  } else if (!health.platform_reachable) {
    lines.push("    1. Verify CASH_SAAS_CORE_URL is correct and accessible");
    lines.push("    2. Check if cash-saas-core-v2 is running");
    lines.push("    3. Verify CASH_SAAS_ADMIN_API_KEY is valid");
    lines.push("    4. Check network connectivity and firewall rules");
  } else if (health.stripe_mode === "disabled") {
    lines.push("    1. Configure Stripe keys in cash-saas-core-v2");
    lines.push("    2. Create Stripe products and prices");
    lines.push("    3. Configure Stripe webhook endpoint");
  } else if (health.stripe_mode === "test") {
    lines.push("    ✅ Revenue spine healthy in test mode");
    lines.push("    → Switch Stripe to live mode for production deployment");
  } else {
    lines.push("    ✅ Revenue spine fully operational");
  }

  lines.push("");
  lines.push("─────────────────────────────────────────────────────");

  return lines.join("\n");
}
