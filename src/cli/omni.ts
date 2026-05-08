#!/usr/bin/env npx tsx

const API_BASE = process.env.OMNI_API_URL || "http://localhost:3099";

async function api(method: string, path: string, body?: unknown) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

async function cmdList() {
  const data = await api("GET", "/api/apps");
  console.log(`\n⚡ OMNI-FORGE — ${data.total} Apps\n`);
  console.log("Name".padEnd(30) + "Status".padEnd(15) + "Category".padEnd(20) + "MRR".padEnd(10) + "Deploy");
  console.log("─".repeat(90));
  for (const app of data.apps) {
    console.log(
      app.name.padEnd(30) +
      app.status.padEnd(15) +
      app.category.padEnd(20) +
      `$${app.estimatedMrr}`.padEnd(10) +
      app.deploymentStatus
    );
  }
}

async function cmdGenerate(name: string, category: string, price: string) {
  console.log(`\n🔧 Generating: ${name} (${category}, $${price}/mo)...\n`);
  const data = await api("POST", "/api/generate", {
    name,
    description: `${name} — generated via Omni-Forge CLI`,
    category,
    revenueMode: parseFloat(price) > 0 ? "subscription" : "free",
    priceMonthly: parseFloat(price),
  });
  console.log(`✅ Created: ${data.app.name} (${data.app.slug})`);
  console.log(`   Port: ${data.app.port}`);
  console.log(`   Score: ${data.app.artifactIntegrityScore}`);
  console.log(`   MRR: $${data.app.estimatedMrr}`);
  console.log(`   Files: ${data.files.length}`);
  console.log(`   Validation: ${data.validationReport.passed ? "PASSED" : "BLOCKED"} (${data.validationReport.score})`);
}

async function cmdDeployCheck(appId: string) {
  console.log(`\n📦 Checking deployment readiness for ${appId}...\n`);
  const data = await api("POST", "/api/deploy-check", { appId });
  console.log(`Score: ${data.score}% — ${data.status}`);
  for (const check of data.checks) {
    console.log(`  ${check.passed ? "✓" : "✗"} ${check.detail}`);
  }
}

async function cmdRevenueSim() {
  console.log("\n💰 Running revenue simulation...\n");
  const data = await api("POST", "/api/revenue-sim", {});
  console.log(`Portfolio MRR: $${data.portfolio.portfolioMrr}`);
  console.log(`Annual Projection: $${data.portfolio.annualProjection}`);
  console.log(`Total Apps: ${data.portfolio.totalApps}`);
  console.log("\n📊 Top Rankings:");
  for (const r of data.portfolio.rankings.slice(0, 5)) {
    console.log(`  #${r.rank} ${r.name} — $${r.estimatedMrr}/mo (${r.tier})`);
  }
  console.log("\n🎯 Next Best Apps:");
  for (const a of data.nextBestApps) {
    console.log(`  ${a.name} — Score: ${a.totalScore} — $${a.recommendedPrice}/mo — ${a.estimatedTimeToLaunch}`);
  }
}

async function cmdValidate(appId: string) {
  console.log(`\n🔬 Validating ${appId}...\n`);
  const data = await api("POST", "/api/validation", { appId });
  console.log(`Score: ${data.artifactScore.score} (${data.artifactScore.label})`);
  console.log(`Gate: ${data.passed ? "PASSED ✅" : "BLOCKED ❌"}`);
  console.log(`Issues: ${data.issues.length}`);
  for (const issue of data.issues.slice(0, 10)) {
    console.log(`  [${issue.severity}] ${issue.message}`);
  }
}

async function cmdMarketplace() {
  const data = await api("GET", "/api/marketplace");
  console.log(`\n🏪 Marketplace — ${data.total} listings\n`);
  for (const l of data.listings) {
    console.log(`  ${l.featured ? "⭐" : "  "} ${l.title} — $${l.price} — ★${l.rating} — ${l.cloneCount} clones`);
  }
}

async function cmdAgents(appId: string) {
  console.log(`\n🤖 Running agent swarm on ${appId}...\n`);
  const data = await api("POST", "/api/agents", { appId });
  console.log(`Total: ${data.totalProposals} | Accepted: ${data.acceptedCount} | Rejected: ${data.rejectedCount}\n`);
  for (const entry of data.commitLog) {
    console.log(`  ${entry}`);
  }
}

async function cmdDoctor() {
  console.log("\n🩺 OMNI-FORGE DOCTOR\n");
  const health = await api("GET", "/api/health");
  console.log(`Fleet: ${health.system.totalApps} apps`);
  console.log(`Healthy: ${health.system.healthy} | Degraded: ${health.system.degraded} | Failing: ${health.system.failing}`);
  console.log(`Average Score: ${health.system.averageScore}\n`);
  const billing = await api("GET", "/api/billing");
  console.log(`Billing: ${billing.billing.enabled ? "Active (Stripe)" : "Disabled"}`);
  console.log(`Platform Tiers: ${billing.platformTiers.map((t: { name: string }) => t.name).join(", ")}`);
}

const [,, command, ...args] = process.argv;

const commands: Record<string, () => Promise<void>> = {
  list: () => cmdList(),
  generate: () => cmdGenerate(args[0] || "New App", args[1] || "paid-api", args[2] || "29"),
  "deploy-check": () => cmdDeployCheck(args[0]),
  "revenue-sim": () => cmdRevenueSim(),
  validate: () => cmdValidate(args[0]),
  marketplace: () => cmdMarketplace(),
  agents: () => cmdAgents(args[0]),
  doctor: () => cmdDoctor(),
};

if (!command || !commands[command]) {
  console.log(`
⚡ OMNI-FORGE CLI — Phase 3

Usage: npx tsx src/cli/omni.ts <command> [args]

Commands:
  list                        List all apps in the registry
  generate <name> <cat> <$>   Generate a new app
  deploy-check <appId>        Check deployment readiness
  revenue-sim                 Run revenue simulation
  validate <appId>            Run TemplateForge validation
  marketplace                 Browse marketplace listings
  agents <appId>              Run agent swarm on an app
  doctor                      System health check
`);
  process.exit(0);
}

commands[command]().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
