#!/usr/bin/env node
// ============================================================================
// Revenue Spine CLI — Omni-Forge Phase 3.5
// CLI commands for managing the revenue spine integration.
//
// Usage:
//   npx tsx src/cli/revenue-spine.ts doctor
//   npx tsx src/cli/revenue-spine.ts sync --app-name "My App" --slug my-app --mode paid_api_app
//   npx tsx src/cli/revenue-spine.ts env --slug my-app --mode subscription_saas
//   npx tsx src/cli/revenue-spine.ts checklist --slug my-app --mode credit_based_workflow_app
// ============================================================================

import { generateDoctorReport, checkRevenueSpineHealth } from "../lib/revenue-spine/revenueSpineHealth";
import { syncGeneratedApp } from "../lib/revenue-spine/generatedAppSync";
import {
  buildQuotaPolicy,
  buildRecommendedEnvVars,
  generateEnvExample,
} from "../lib/revenue-spine/usagePolicyBuilder";
import { buildDeploymentChecklist, type GeneratedAppMetadata } from "../lib/revenue-spine/billingProfileMapper";
import type { MonetizationMode } from "../lib/revenue-spine/revenueSpineTypes";

const VALID_MODES: MonetizationMode[] = [
  "static_free_app",
  "paid_api_app",
  "subscription_saas",
  "credit_based_workflow_app",
  "marketplace_template",
];

// ── Arg Parser ──────────────────────────────────────────────────────────────

function parseArgs(args: string[]): { command: string; flags: Record<string, string> } {
  const command = args[0] ?? "help";
  const flags: Record<string, string> = {};

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const value = args[i + 1] ?? "true";
      if (!value.startsWith("--")) {
        flags[key] = value;
        i++;
      } else {
        flags[key] = "true";
      }
    }
  }

  return { command, flags };
}

function buildAppMetadata(flags: Record<string, string>): GeneratedAppMetadata {
  const mode = (flags["mode"] ?? "static_free_app") as MonetizationMode;
  if (!VALID_MODES.includes(mode)) {
    console.error(`❌ Invalid mode: ${mode}`);
    console.error(`   Valid modes: ${VALID_MODES.join(", ")}`);
    process.exit(1);
  }

  return {
    appName: flags["app-name"] ?? flags["slug"] ?? "unnamed-app",
    appSlug: flags["slug"] ?? "unnamed-app",
    appId: flags["app-id"] ?? "00000000-0000-0000-0000-000000000000",
    description: flags["description"],
    monetizationMode: mode,
    features: (flags["features"] ?? "").split(",").filter(Boolean),
    hasAuth: flags["auth"] === "true",
    hasDashboard: flags["dashboard"] === "true",
    hasApi: flags["api"] === "true" || mode === "paid_api_app",
  };
}

// ── Commands ────────────────────────────────────────────────────────────────

async function commandDoctor() {
  const report = await generateDoctorReport();
  console.log(report);
}

async function commandSync(flags: Record<string, string>) {
  if (!flags["slug"]) {
    console.error("❌ --slug is required for sync command");
    process.exit(1);
  }

  const app = buildAppMetadata(flags);
  console.log(`\n🔄 Syncing ${app.appName} (${app.monetizationMode})...\n`);

  const result = await syncGeneratedApp(app);

  if (result.success) {
    console.log("✅ Sync completed successfully\n");
  } else {
    console.log("⚠️  Sync completed with errors\n");
  }

  console.log("App Registration:", result.appRegistration.success ? "✅" : "❌", JSON.stringify(result.appRegistration.details));
  console.log("Billing Profile:", result.billingProfile.success ? "✅" : "❌", JSON.stringify(result.billingProfile.details));
  console.log("API Product:", result.apiProduct.success ? "✅" : "❌", JSON.stringify(result.apiProduct.details));
  console.log("\nStripe Readiness:", JSON.stringify(result.stripeReadiness, null, 2));

  if (result.errors.length > 0) {
    console.log("\n⚠ Errors:");
    for (const err of result.errors) {
      console.log(`  • ${err}`);
    }
  }
}

async function commandEnv(flags: Record<string, string>) {
  if (!flags["slug"]) {
    console.error("❌ --slug is required for env command");
    process.exit(1);
  }

  const app = buildAppMetadata(flags);
  const envContent = generateEnvExample(app);
  console.log(envContent);
}

async function commandChecklist(flags: Record<string, string>) {
  if (!flags["slug"]) {
    console.error("❌ --slug is required for checklist command");
    process.exit(1);
  }

  const app = buildAppMetadata(flags);
  const checklist = buildDeploymentChecklist(app);

  console.log(`\n📋 Deployment Checklist — ${app.appName} (${app.monetizationMode})\n`);

  for (const item of checklist) {
    const status = item.completed ? "✅" : "⬜";
    console.log(`  ${status} Step ${item.step}: ${item.action}`);
    console.log(`      ${item.details}`);
  }

  console.log(`\n  Total steps: ${checklist.length}`);
  console.log(`  Completed: ${checklist.filter((i) => i.completed).length}`);
}

async function commandQuota(flags: Record<string, string>) {
  if (!flags["slug"]) {
    console.error("❌ --slug is required for quota command");
    process.exit(1);
  }

  const app = buildAppMetadata(flags);
  const policy = buildQuotaPolicy(app);

  console.log(`\n📊 Quota Policy — ${policy.name}\n`);
  console.log(`  Enforcement: ${policy.enforcement}`);
  console.log(`  Grace period: ${policy.grace_period_minutes} min`);
  console.log(`  Notification thresholds: ${policy.notification_thresholds.join("%, ")}%\n`);
  console.log("  Limits:");
  for (const limit of policy.limits) {
    console.log(`    ${limit.metric}: ${limit.limit} per ${limit.window} → ${limit.action_on_exceed}`);
  }
}

function commandHelp() {
  console.log(`
Omni-Forge Revenue Spine CLI

Commands:
  doctor                     Check revenue spine connection health
  sync   --slug <slug>       Sync a generated app with cash-saas-core-v2
  env    --slug <slug>       Generate .env.example for a generated app
  checklist --slug <slug>    Show deployment checklist for a generated app
  quota  --slug <slug>       Show quota policy for a generated app
  help                       Show this help

Flags:
  --slug <slug>              App slug (required for most commands)
  --app-name <name>          Human-readable app name
  --mode <mode>              Monetization mode (default: static_free_app)
  --description <text>       App description
  --features <a,b,c>         Comma-separated feature list
  --auth true                App has authentication
  --dashboard true           App has a dashboard
  --api true                 App has an API

Valid monetization modes:
  static_free_app, paid_api_app, subscription_saas,
  credit_based_workflow_app, marketplace_template
`);
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const { command, flags } = parseArgs(process.argv.slice(2));

  switch (command) {
    case "doctor":
      await commandDoctor();
      break;
    case "sync":
      await commandSync(flags);
      break;
    case "env":
      await commandEnv(flags);
      break;
    case "checklist":
      await commandChecklist(flags);
      break;
    case "quota":
      await commandQuota(flags);
      break;
    case "help":
    default:
      commandHelp();
      break;
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
