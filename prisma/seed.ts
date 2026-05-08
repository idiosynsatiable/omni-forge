import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const seedApps = [
  {
    name: "Resume AI Pro",
    slug: "resume-ai-pro",
    description: "Analyze resume text and return score, strengths, weaknesses, and rewritten bullet suggestions powered by GPT.",
    category: "ai-tool",
    status: "generated",
    port: 4101,
    revenueMode: "freemium",
    priceMonthly: 19,
    estimatedMrr: 76,
    artifactIntegrityScore: 97,
    deploymentStatus: "config_generated",
    launchPriorityScore: 82,
    revenueProbabilityScore: 75,
  },
  {
    name: "SEO Brief Generator",
    slug: "seo-brief-generator",
    description: "Accepts a topic keyword and returns SEO title ideas, keyword clusters, content outline, meta description, and internal linking suggestions.",
    category: "seo-tool",
    status: "generated",
    port: 4102,
    revenueMode: "freemium",
    priceMonthly: 29,
    estimatedMrr: 116,
    artifactIntegrityScore: 95,
    deploymentStatus: "config_generated",
    launchPriorityScore: 88,
    revenueProbabilityScore: 80,
  },
  {
    name: "Landing Page Auditor",
    slug: "landing-page-auditor",
    description: "Accepts page copy and returns conversion score, clarity score, trust issues, CTA recommendations, and A/B test suggestions.",
    category: "creator-tool",
    status: "generated",
    port: 4103,
    revenueMode: "freemium",
    priceMonthly: 39,
    estimatedMrr: 156,
    artifactIntegrityScore: 92,
    deploymentStatus: "ready",
    launchPriorityScore: 91,
    revenueProbabilityScore: 85,
  },
  {
    name: "Cold Email Sequencer",
    slug: "cold-email-sequencer",
    description: "Generate personalized cold email sequences with subject lines, follow-ups, and A/B variants from a prospect description.",
    category: "automation-tool",
    status: "generated",
    port: 4104,
    revenueMode: "subscription",
    priceMonthly: 49,
    estimatedMrr: 196,
    artifactIntegrityScore: 88,
    deploymentStatus: "config_generated",
    launchPriorityScore: 78,
    revenueProbabilityScore: 70,
  },
  {
    name: "API Usage Dashboard",
    slug: "api-usage-dashboard",
    description: "Internal dashboard for monitoring API request volumes, error rates, latency percentiles, and usage by endpoint.",
    category: "internal-dashboard",
    status: "draft",
    port: 4105,
    revenueMode: "freemium",
    priceMonthly: 0,
    estimatedMrr: 0,
    artifactIntegrityScore: 0,
    deploymentStatus: "not_configured",
    launchPriorityScore: 45,
    revenueProbabilityScore: 20,
  },
];

async function main() {
  console.log("🌱 Seeding Omni-Forge Phase 3 registry...");

  for (const app of seedApps) {
    const created = await prisma.app.upsert({
      where: { slug: app.slug },
      update: app,
      create: app,
    });
    console.log(`  ✅ ${created.name} (port ${created.port})`);

    if (app.estimatedMrr > 0) {
      await prisma.revenueSnapshot.create({
        data: {
          appId: created.id,
          visitorsPerMonth: 1000,
          conversionRate: 0.04,
          churnRate: 0.05,
          averagePrice: app.priceMonthly,
          grossMargin: 0.85,
          estimatedMrr: app.estimatedMrr,
          retentionAdjustedRevenue: app.estimatedMrr * 0.95,
        },
      });
    }

    if (app.artifactIntegrityScore >= 85) {
      await prisma.marketplaceListing.upsert({
        where: { appId: created.id },
        update: {
          title: app.name,
          description: app.description,
          category: app.category,
          price: app.priceMonthly,
          rating: 4.0 + Math.random() * 0.9,
          featured: app.launchPriorityScore > 85,
        },
        create: {
          appId: created.id,
          title: app.name,
          description: app.description,
          category: app.category,
          price: app.priceMonthly,
          rating: 4.0 + Math.random() * 0.9,
          featured: app.launchPriorityScore > 85,
        },
      });
    }
  }

  console.log("✅ Seed complete — apps, snapshots, and marketplace listings created.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
