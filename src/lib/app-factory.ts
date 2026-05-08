import fs from "fs";
import path from "path";
import prisma from "./db";
import { toSlug } from "./validators";
import { safePath, sanitizeForTemplate } from "./security";
import { planApp } from "./app-planner";
import { generateBillingProfile } from "./billing/pricing";
import { generateEnvExample } from "./deployment/env-generator";
import { generateAppDockerfile } from "./deployment/docker-bundle";
import { generateVercelConfigFile } from "./deployment/vercel";
import { generateRailwayToml } from "./deployment/railway";
import { runValidationGate } from "./templateforge/validation-gate";
import { simulateRevenue } from "./revenue/simulator";
import { getNextPort } from "./registry";
import { registerApp as cashSaasRegister, generateCashSaasEnvBlock, getCashSaasStatus } from "./cash-saas";

export interface CashSaasIntegration {
  registered: boolean;
  appId: number | null;
  backendUrl: string;
  error: string | null;
}

export interface GeneratedApp {
  app: {
    id: string;
    name: string;
    slug: string;
    port: number;
    status: string;
    artifactIntegrityScore: number;
    estimatedMrr: number;
  };
  directory: string;
  files: string[];
  plan: ReturnType<typeof planApp>;
  billingProfile: ReturnType<typeof generateBillingProfile>;
  validationReport: ReturnType<typeof runValidationGate>;
  revenueForecast: ReturnType<typeof simulateRevenue>;
  cashSaas: CashSaasIntegration;
}

export async function generateApp(input: {
  name: string;
  description: string;
  category: string;
  revenueMode: string;
  priceMonthly: number;
  usageUnitPrice?: number;
}): Promise<GeneratedApp> {
  const slug = toSlug(input.name);
  const port = await getNextPort();
  const safedir = safePath(slug);
  const plan = planApp({ ...input, slug });
  const billing = generateBillingProfile({
    slug,
    revenueMode: input.revenueMode,
    priceMonthly: input.priceMonthly,
    usageUnitPrice: input.usageUnitPrice || 0,
  });

  const safeName = sanitizeForTemplate(input.name);
  const safeDesc = sanitizeForTemplate(input.description);

  const files: Array<{ path: string; content: string; fileType: string }> = [
    {
      path: `${slug}/manifest.json`,
      fileType: "json",
      content: JSON.stringify(
        {
          name: input.name,
          slug,
          description: input.description,
          category: input.category,
          version: "1.0.0",
          port,
          revenueMode: input.revenueMode,
          priceMonthly: input.priceMonthly,
          apiRoute: "/run",
          healthRoute: "/health",
          features: plan.features,
          techStack: plan.techStack,
          billing,
        },
        null,
        2
      ),
    },
    {
      path: `${slug}/package.json`,
      fileType: "json",
      content: JSON.stringify(
        {
          name: slug,
          version: "1.0.0",
          description: input.description,
          main: "server.ts",
          scripts: {
            dev: `PORT=${port} npx tsx watch server.ts`,
            start: `PORT=${port} npx tsx server.ts`,
            build: "echo 'No build step required'",
          },
          dependencies: {
            express: "^4.21.0",
            cors: "^2.8.5",
            zod: "^3.25.0",
          },
          devDependencies: {
            "@types/express": "^4.17.21",
            "@types/cors": "^2.8.17",
            tsx: "^4.21.0",
            typescript: "^5.9.0",
          },
        },
        null,
        2
      ),
    },
    {
      path: `${slug}/server.ts`,
      fileType: "typescript",
      content: `import express from "express";
import cors from "cors";
import { z } from "zod";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = parseInt(process.env.PORT || "${port}", 10);

const runInputSchema = z.object({
  input: z.string().min(1).max(5000),
  options: z.record(z.unknown()).optional(),
});

app.get("/health", (_req, res) => {
  res.json({
    status: "healthy",
    app: "${safeName}",
    version: "1.0.0",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get("/manifest", (_req, res) => {
  res.json({
    name: "${safeName}",
    slug: "${slug}",
    description: "${safeDesc}",
    category: "${input.category}",
    version: "1.0.0",
    port: PORT,
    endpoints: ["/health", "/run", "/manifest"],
  });
});

app.post("/run", async (req, res) => {
  try {
    const parsed = runInputSchema.parse(req.body);

    const result = {
      success: true,
      app: "${safeName}",
      input: parsed.input,
      output: {
        analysis: \`Processed: \${parsed.input.slice(0, 100)}\`,
        score: Math.round(Math.random() * 40 + 60),
        recommendations: [
          "Optimize for target audience engagement",
          "Add structured data for better discoverability",
          "Include clear call-to-action elements",
        ],
        metadata: {
          processedAt: new Date().toISOString(),
          version: "1.0.0",
          inputLength: parsed.input.length,
        },
      },
    };

    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", details: error.errors });
      return;
    }
    res.status(500).json({ error: "Processing failed" });
  }
});

app.listen(PORT, () => {
  console.log(\`[${safeName}] Running on port \${PORT}\`);
});
`,
    },
    {
      path: `${slug}/README.md`,
      fileType: "markdown",
      content: `# ${input.name}

${input.description}

## Quick Start

\`\`\`bash
npm install
npm run dev
\`\`\`

Server starts on port ${port}.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /health | Health check |
| GET | /manifest | App metadata |
| POST | /run | Core functionality |

## Environment Variables

See \`.env.example\` for all configuration options.

## Billing

- Revenue Mode: ${input.revenueMode}
- Price: $${input.priceMonthly}/mo
- Stripe Price ID: Set via \`${billing.stripePriceIdEnvName}\` env var

## Deployment

### Docker
\`\`\`bash
docker build -t ${slug} .
docker run -p ${port}:${port} ${slug}
\`\`\`

### Vercel
Deploy using the included \`vercel.json\` configuration.

### Railway
Deploy using the included \`railway.toml\` configuration.

## License

Private — All rights reserved.
`,
    },
    {
      path: `${slug}/.env.example`,
      fileType: "env",
      content: generateEnvExample({
        slug,
        port,
        revenueMode: input.revenueMode,
        category: input.category,
      }),
    },
    {
      path: `${slug}/Dockerfile`,
      fileType: "dockerfile",
      content: generateAppDockerfile({ slug, port }),
    },
    {
      path: `${slug}/vercel.json`,
      fileType: "json",
      content: generateVercelConfigFile({ slug, port, revenueMode: input.revenueMode }),
    },
    {
      path: `${slug}/railway.toml`,
      fileType: "toml",
      content: generateRailwayToml({ slug, port, revenueMode: input.revenueMode }),
    },
  ];

  const validationReport = runValidationGate(
    {
      name: input.name,
      slug,
      description: input.description,
      category: input.category,
      revenueMode: input.revenueMode,
      priceMonthly: input.priceMonthly,
    },
    files
  );

  const revenueForecast = simulateRevenue({
    averagePrice: input.priceMonthly,
  });

  fs.mkdirSync(safedir, { recursive: true });
  for (const file of files) {
    const filePath = path.join(
      safedir,
      file.path.startsWith(slug + "/") ? file.path.slice(slug.length + 1) : file.path
    );
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, file.content, "utf-8");
  }

  const created = await prisma.app.create({
    data: {
      name: input.name,
      slug,
      description: input.description,
      category: input.category,
      status: "generated",
      port,
      revenueMode: input.revenueMode,
      priceMonthly: input.priceMonthly,
      usageUnitPrice: input.usageUnitPrice || 0,
      artifactIntegrityScore: validationReport.artifactScore.score,
      estimatedMrr: revenueForecast.mrr,
      revenueProbabilityScore: Math.min(100, revenueForecast.mrr > 0 ? 70 : 20),
      launchPriorityScore: Math.min(100, validationReport.artifactScore.score * 0.6 + (revenueForecast.mrr > 0 ? 30 : 0)),
      deploymentStatus: validationReport.passed ? "config_generated" : "blocked",
    },
  });

  for (const file of files) {
    await prisma.generatedFile.create({
      data: {
        appId: created.id,
        path: file.path,
        content: file.content,
        fileType: file.fileType,
      },
    });
  }

  for (const issue of validationReport.issues) {
    await prisma.validationIssue.create({
      data: {
        appId: created.id,
        severity: issue.severity,
        category: issue.category,
        message: issue.message,
        lineNumber: issue.line,
        matchedText: issue.matchedText.slice(0, 200),
        suggestedFix: issue.suggestedFix,
      },
    });
  }

  await prisma.revenueSnapshot.create({
    data: {
      appId: created.id,
      visitorsPerMonth: 1000,
      conversionRate: 0.04,
      churnRate: 0.05,
      averagePrice: input.priceMonthly,
      grossMargin: 0.85,
      estimatedMrr: revenueForecast.mrr,
      retentionAdjustedRevenue: revenueForecast.retentionAdjustedRevenue,
    },
  });

  // ── Cash SaaS Core V2 Integration ──
  // Auto-register generated app with the monetization backend
  let cashSaasIntegration: CashSaasIntegration = {
    registered: false,
    appId: null,
    backendUrl: process.env.CASH_SAAS_URL || "http://localhost:8000",
    error: null,
  };

  const cashSaasStatus = await getCashSaasStatus();
  if (cashSaasStatus.connected) {
    try {
      const registered = await cashSaasRegister({
        organizationId: 1, // Default org — override per deployment
        appName: input.name,
        appSlug: slug,
        revenueMode: input.revenueMode,
        freeQuota: 100,
        paidPlan: "starter",
        usageUnit: "api_call",
        usagePriceCents: input.usageUnitPrice || 5,
      });

      if (registered) {
        cashSaasIntegration = {
          registered: true,
          appId: registered.id,
          backendUrl: cashSaasIntegration.backendUrl,
          error: null,
        };
      }
    } catch (err) {
      cashSaasIntegration.error = err instanceof Error ? err.message : String(err);
    }

    // Append cash-saas env vars to the generated .env.example
    const envPath = path.join(safedir, ".env.example");
    if (fs.existsSync(envPath)) {
      const cashSaasEnv = generateCashSaasEnvBlock(slug);
      fs.appendFileSync(envPath, "\n" + cashSaasEnv, "utf-8");
    }
  }

  return {
    app: {
      id: created.id,
      name: created.name,
      slug: created.slug,
      port: created.port,
      status: created.status,
      artifactIntegrityScore: created.artifactIntegrityScore,
      estimatedMrr: created.estimatedMrr,
    },
    directory: safedir,
    files: files.map((f) => f.path),
    plan,
    billingProfile: billing,
    validationReport,
    revenueForecast,
    cashSaas: cashSaasIntegration,
  };
}
