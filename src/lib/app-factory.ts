import fs from "fs";
import path from "path";
import { createHash } from "crypto";
import { Prisma } from "@prisma/client";

import prisma from "./db";
import { toSlug } from "./validators";
import { safeAppPath, sanitizeForTemplate } from "./security";
import { planApp } from "./app-planner";
import { generateBillingProfile } from "./billing/pricing";
import { generateEnvExample } from "./deployment/env-generator";
import { generateAppDockerfile } from "./deployment/docker-bundle";
import { generateVercelConfigFile } from "./deployment/vercel";
import { generateRailwayToml } from "./deployment/railway";
import { runValidationGate } from "./templateforge/validation-gate";
import { simulateRevenue } from "./revenue/simulator";
import { getNextPort } from "./registry";
import {
  registerApp as cashSaasRegister,
  generateCashSaasEnvBlock,
} from "./cash-saas";

const GENERATION_LEASE_MS = 2 * 60 * 1000;

export class GenerationConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GenerationConflictError";
  }
}

export class GenerationInProgressError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GenerationInProgressError";
  }
}

export interface GenerationContext {
  organizationId: number;
  userId: number;
  accessToken: string;
  idempotencyKey: string;
}

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
  replayed: boolean;
  directory: string;
  files: string[];
  plan: ReturnType<typeof planApp>;
  billingProfile: ReturnType<typeof generateBillingProfile>;
  validationReport: ReturnType<typeof runValidationGate>;
  revenueForecast: ReturnType<typeof simulateRevenue>;
  cashSaas: CashSaasIntegration;
}

type GenerateInput = {
  name: string;
  description: string;
  category: string;
  revenueMode: string;
  priceMonthly: number;
  usageUnitPrice?: number;
};

type Artifact = { path: string; content: string; fileType: string };

function assertGenerationContext(context: GenerationContext): void {
  if (!Number.isSafeInteger(context.organizationId) || context.organizationId <= 0) {
    throw new Error("A positive organization id is required");
  }
  if (!Number.isSafeInteger(context.userId) || context.userId <= 0) {
    throw new Error("A valid authenticated user id is required");
  }
  if (!context.accessToken.trim()) {
    throw new Error("A current bearer token is required");
  }
  if (
    context.idempotencyKey.length < 8 ||
    context.idempotencyKey.length > 200 ||
    !/^[A-Za-z0-9._:-]+$/.test(context.idempotencyKey)
  ) {
    throw new Error("Invalid idempotency key");
  }
}

function requestHash(input: GenerateInput, organizationId: number): string {
  const canonical = JSON.stringify({
    organizationId,
    name: input.name,
    description: input.description,
    category: input.category,
    revenueMode: input.revenueMode,
    priceMonthly: input.priceMonthly,
    usageUnitPrice: input.usageUnitPrice || 0,
  });
  return createHash("sha256").update(canonical).digest("hex");
}

function safeFailureMessage(error: unknown): string {
  if (!(error instanceof Error)) return "Generation failed";
  return error.message.replace(/[\r\n\t]+/g, " ").slice(0, 300) || "Generation failed";
}

function makeArtifacts(input: GenerateInput, slug: string, port: number): {
  files: Artifact[];
  plan: ReturnType<typeof planApp>;
  billing: ReturnType<typeof generateBillingProfile>;
} {
  const plan = planApp({ ...input, slug });
  const billing = generateBillingProfile({
    slug,
    revenueMode: input.revenueMode,
    priceMonthly: input.priceMonthly,
    usageUnitPrice: input.usageUnitPrice || 0,
  });
  const safeName = sanitizeForTemplate(input.name);
  const safeDesc = sanitizeForTemplate(input.description);
  const cashEnv = generateCashSaasEnvBlock(slug);

  const files: Artifact[] = [
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
          security: {
            runAuth: "x-api-key",
            cors: "explicit-allowlist",
            requestBodyLimit: "REQUEST_MAX_BYTES",
            rateLimit: "RATE_LIMIT_PER_MINUTE",
          },
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
          private: true,
          description: input.description,
          main: "server.ts",
          scripts: {
            dev: `PORT=${port} npx tsx watch server.ts`,
            start: `PORT=${port} npx tsx server.ts`,
            build: "npx tsc --noEmit",
            typecheck: "npx tsc --noEmit",
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
      path: `${slug}/tsconfig.json`,
      fileType: "json",
      content: JSON.stringify(
        {
          compilerOptions: {
            target: "ES2022",
            module: "NodeNext",
            moduleResolution: "NodeNext",
            strict: true,
            esModuleInterop: true,
            skipLibCheck: true,
            noEmit: true,
          },
          include: ["server.ts"],
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
import { createHash, timingSafeEqual } from "crypto";
import { z } from "zod";

const app = express();
app.disable("x-powered-by");

const PORT = Number.parseInt(process.env.PORT || "${port}", 10);
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const RUN_API_KEY = process.env.RUN_API_KEY || "";
const REQUEST_MAX_BYTES = Number.parseInt(process.env.REQUEST_MAX_BYTES || "65536", 10);
const RATE_LIMIT_PER_MINUTE = Number.parseInt(process.env.RATE_LIMIT_PER_MINUTE || "60", 10);
const CORS_ORIGINS = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map(value => value.trim())
  .filter(Boolean);

if (!Number.isSafeInteger(PORT) || PORT < 1 || PORT > 65535) {
  throw new Error("PORT must be between 1 and 65535");
}
if (!Number.isSafeInteger(REQUEST_MAX_BYTES) || REQUEST_MAX_BYTES < 1024 || REQUEST_MAX_BYTES > 10 * 1024 * 1024) {
  throw new Error("REQUEST_MAX_BYTES must be between 1 KiB and 10 MiB");
}
if (!Number.isSafeInteger(RATE_LIMIT_PER_MINUTE) || RATE_LIMIT_PER_MINUTE < 1 || RATE_LIMIT_PER_MINUTE > 100000) {
  throw new Error("RATE_LIMIT_PER_MINUTE must be between 1 and 100000");
}
if (IS_PRODUCTION) {
  if (RUN_API_KEY.length < 32) {
    throw new Error("RUN_API_KEY must be configured with at least 32 characters in production");
  }
  if (CORS_ORIGINS.length === 0 || CORS_ORIGINS.includes("*")) {
    throw new Error("CORS_ORIGINS must contain explicit HTTPS origins in production");
  }
  for (const origin of CORS_ORIGINS) {
    const parsed = new URL(origin);
    if (parsed.protocol !== "https:") {
      throw new Error("CORS_ORIGINS must use HTTPS in production");
    }
  }
}

app.use((req, res, next) => {
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
  if (IS_PRODUCTION) {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
});

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (CORS_ORIGINS.includes(origin)) return callback(null, true);
    return callback(new Error("CORS origin denied"));
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "x-api-key"],
  credentials: false,
  maxAge: 600,
}));
app.use(express.json({ limit: REQUEST_MAX_BYTES }));

const runInputSchema = z.object({
  input: z.string().min(1).max(5000),
  options: z.record(z.unknown()).optional(),
});

const rateLimits = new Map<string, { count: number; resetAt: number }>();
function allowRequest(key: string): boolean {
  const now = Date.now();
  const current = rateLimits.get(key);
  if (!current || current.resetAt <= now) {
    rateLimits.set(key, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (current.count >= RATE_LIMIT_PER_MINUTE) return false;
  current.count += 1;
  if (rateLimits.size > 5000) {
    for (const [candidate, value] of rateLimits) {
      if (value.resetAt <= now) rateLimits.delete(candidate);
    }
  }
  return true;
}

function secureEqual(expected: string, presented: string): boolean {
  const left = Buffer.from(expected, "utf8");
  const right = Buffer.from(presented, "utf8");
  if (left.length === 0 || left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function requireRunAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!RUN_API_KEY) {
    if (IS_PRODUCTION) return res.status(503).json({ error: "Service is not configured" });
    return next();
  }
  const presented = req.get("x-api-key") || "";
  if (!secureEqual(RUN_API_KEY, presented)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

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

app.post("/run", requireRunAuth, (req, res) => {
  const client = req.ip || req.socket.remoteAddress || "unknown";
  if (!allowRequest(client)) {
    res.setHeader("Retry-After", "60");
    return res.status(429).json({ error: "Rate limit exceeded" });
  }

  try {
    const parsed = runInputSchema.parse(req.body);
    const scoreSeed = createHash("sha256").update(parsed.input).digest("hex").slice(0, 8);
    const score = (Number.parseInt(scoreSeed, 16) % 41) + 60;

    return res.json({
      success: true,
      app: "${safeName}",
      input: parsed.input,
      output: {
        analysis: \`Processed: \${parsed.input.slice(0, 100)}\`,
        score,
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
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: error.errors });
    }
    return res.status(500).json({ error: "Processing failed" });
  }
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof Error && error.message === "CORS origin denied") {
    return res.status(403).json({ error: "Origin denied" });
  }
  return res.status(500).json({ error: "Internal server error" });
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
npm run typecheck
npm run dev
\`\`\`

Server starts on port ${port}.

## Endpoints

| Method | Path | Access |
|--------|------|--------|
| GET | /health | public health signal |
| GET | /manifest | public app metadata |
| POST | /run | requires \`x-api-key\` in production |

## Security contract

Production fails closed unless \`RUN_API_KEY\` contains at least 32 characters and \`CORS_ORIGINS\` contains explicit HTTPS origins. The service enforces a request-size limit, per-client rate budget, security headers, and constant-time API-key comparison.

## Environment Variables

See \`.env.example\` for the full runtime contract. Never commit populated secrets.

## Billing

- Revenue Mode: ${input.revenueMode}
- Price: $${input.priceMonthly}/mo
- Stripe Price ID: configure \`${billing.stripePriceIdEnvName}\` outside source control

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
      content:
        generateEnvExample({
          slug,
          port,
          revenueMode: input.revenueMode,
          category: input.category,
        }) + "\n" + cashEnv,
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

  return { files, plan, billing };
}

async function findGenerationByKey(context: GenerationContext) {
  return prisma.app.findFirst({
    where: {
      organizationId: context.organizationId,
      idempotencyKey: context.idempotencyKey,
    },
  });
}

async function claimGeneration(input: GenerateInput, context: GenerationContext, slug: string, hash: string) {
  const existing = await findGenerationByKey(context);
  if (existing) {
    if (existing.requestHash && existing.requestHash !== hash) {
      throw new GenerationConflictError(
        "Idempotency key was already used with a different generation request"
      );
    }

    if (existing.slug !== slug) {
      throw new GenerationConflictError("Idempotency key is already bound to another app slug");
    }

    if (existing.status === "generated") {
      return { app: existing, replayed: true, completed: true };
    }

    const leaseAge = Date.now() - existing.updatedAt.getTime();
    if (existing.status === "generating" && leaseAge < GENERATION_LEASE_MS) {
      throw new GenerationInProgressError("An identical generation request is already in progress");
    }

    const resumed = await prisma.app.update({
      where: { id: existing.id },
      data: {
        name: input.name,
        description: input.description,
        category: input.category,
        revenueMode: input.revenueMode,
        priceMonthly: input.priceMonthly,
        usageUnitPrice: input.usageUnitPrice || 0,
        requestHash: hash,
        createdByUserId: context.userId,
        generationAttempt: { increment: 1 },
        lastGenerationError: "",
        status: "generating",
      },
    });
    return { app: resumed, replayed: true, completed: false };
  }

  const slugConflict = await prisma.app.findFirst({
    where: { organizationId: context.organizationId, slug },
    select: { id: true },
  });
  if (slugConflict) {
    throw new GenerationConflictError(
      "An app with this slug already exists in the selected organization"
    );
  }

  const port = await getNextPort();
  try {
    const created = await prisma.app.create({
      data: {
        organizationId: context.organizationId,
        createdByUserId: context.userId,
        idempotencyKey: context.idempotencyKey,
        requestHash: hash,
        generationAttempt: 1,
        lastGenerationError: "",
        name: input.name,
        slug,
        description: input.description,
        category: input.category,
        status: "generating",
        port,
        revenueMode: input.revenueMode,
        priceMonthly: input.priceMonthly,
        usageUnitPrice: input.usageUnitPrice || 0,
        deploymentStatus: "not_configured",
      },
    });
    return { app: created, replayed: false, completed: false };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const raced = await findGenerationByKey(context);
      if (raced) {
        if (raced.requestHash && raced.requestHash !== hash) {
          throw new GenerationConflictError(
            "Concurrent request reused an idempotency key with different input"
          );
        }
        throw new GenerationInProgressError("An identical generation request won the concurrent claim");
      }
      throw new GenerationConflictError("The app slug is already in use for this organization");
    }
    throw error;
  }
}

function writeAttemptAtomically(directory: string, appId: string, slug: string, files: Artifact[]): () => void {
  const temp = `${directory}.attempt-${appId}`;
  const previous = `${directory}.previous-${appId}`;
  fs.rmSync(temp, { recursive: true, force: true });
  fs.rmSync(previous, { recursive: true, force: true });
  fs.mkdirSync(temp, { recursive: true });

  for (const file of files) {
    const relative = file.path.startsWith(`${slug}/`)
      ? file.path.slice(slug.length + 1)
      : file.path;
    const target = path.resolve(temp, relative);
    const tempRoot = temp.endsWith(path.sep) ? temp : `${temp}${path.sep}`;
    if (target !== temp && !target.startsWith(tempRoot)) {
      throw new Error("Generated file escaped its tenant-scoped attempt directory");
    }
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, file.content, "utf-8");
  }

  let hadPrevious = false;
  try {
    if (fs.existsSync(directory)) {
      fs.renameSync(directory, previous);
      hadPrevious = true;
    }
    fs.renameSync(temp, directory);
  } catch (error) {
    fs.rmSync(temp, { recursive: true, force: true });
    if (hadPrevious && !fs.existsSync(directory) && fs.existsSync(previous)) {
      fs.renameSync(previous, directory);
    }
    throw error;
  }

  return () => {
    fs.rmSync(directory, { recursive: true, force: true });
    if (hadPrevious && fs.existsSync(previous)) {
      fs.renameSync(previous, directory);
    }
  };
}

function finishFilesystemSwap(directory: string, appId: string): void {
  fs.rmSync(`${directory}.previous-${appId}`, { recursive: true, force: true });
}

async function healCashRegistration(
  input: GenerateInput,
  slug: string,
  context: GenerationContext
): Promise<CashSaasIntegration> {
  const backendUrl = process.env.CASH_SAAS_CORE_URL || "";
  try {
    const registered = await cashSaasRegister({
      organizationId: context.organizationId,
      appName: input.name,
      appSlug: slug,
      accessToken: context.accessToken,
      revenueMode: input.revenueMode,
      freeQuota: 100,
      paidPlan: "starter",
      usageUnit: "api_call",
      usagePriceCents: input.usageUnitPrice || 5,
    });
    if (!registered) {
      return {
        registered: false,
        appId: null,
        backendUrl,
        error: backendUrl ? "Cash-SaaS registration is unavailable" : "Cash-SaaS is not configured",
      };
    }
    return {
      registered: true,
      appId: registered.id,
      backendUrl,
      error: null,
    };
  } catch {
    return {
      registered: false,
      appId: null,
      backendUrl,
      error: "Cash-SaaS registration failed and can be retried safely",
    };
  }
}

export async function generateApp(
  input: GenerateInput,
  context: GenerationContext
): Promise<GeneratedApp> {
  assertGenerationContext(context);
  const slug = toSlug(input.name);
  if (!slug) throw new GenerationConflictError("App name does not produce a safe slug");

  const hash = requestHash(input, context.organizationId);
  const claim = await claimGeneration(input, context, slug, hash);
  const directory = safeAppPath(context.organizationId, slug);
  const artifacts = makeArtifacts(input, slug, claim.app.port);
  const validationReport = runValidationGate(
    {
      name: input.name,
      slug,
      description: input.description,
      category: input.category,
      revenueMode: input.revenueMode,
      priceMonthly: input.priceMonthly,
    },
    artifacts.files
  );
  const revenueForecast = simulateRevenue({ averagePrice: input.priceMonthly });

  if (!claim.completed) {
    let rollbackFilesystem: (() => void) | null = null;
    try {
      rollbackFilesystem = writeAttemptAtomically(
        directory,
        claim.app.id,
        slug,
        artifacts.files
      );

      await prisma.$transaction(async (tx) => {
        await tx.generatedFile.deleteMany({ where: { appId: claim.app.id } });
        await tx.validationIssue.deleteMany({ where: { appId: claim.app.id } });
        await tx.revenueSnapshot.deleteMany({ where: { appId: claim.app.id } });

        await tx.generatedFile.createMany({
          data: artifacts.files.map((file) => ({
            appId: claim.app.id,
            path: file.path,
            content: file.content,
            fileType: file.fileType,
          })),
        });

        if (validationReport.issues.length > 0) {
          await tx.validationIssue.createMany({
            data: validationReport.issues.map((issue) => ({
              appId: claim.app.id,
              severity: issue.severity,
              category: issue.category,
              message: issue.message,
              lineNumber: issue.line,
              matchedText: issue.matchedText.slice(0, 200),
              suggestedFix: issue.suggestedFix,
            })),
          });
        }

        await tx.revenueSnapshot.create({
          data: {
            appId: claim.app.id,
            visitorsPerMonth: 1000,
            conversionRate: 0.04,
            churnRate: 0.05,
            averagePrice: input.priceMonthly,
            grossMargin: 0.85,
            estimatedMrr: revenueForecast.mrr,
            retentionAdjustedRevenue: revenueForecast.retentionAdjustedRevenue,
          },
        });

        await tx.app.update({
          where: { id: claim.app.id },
          data: {
            status: "generated",
            lastGenerationError: "",
            artifactIntegrityScore: validationReport.artifactScore.score,
            estimatedMrr: revenueForecast.mrr,
            revenueProbabilityScore: Math.min(100, revenueForecast.mrr > 0 ? 70 : 20),
            launchPriorityScore: Math.min(
              100,
              validationReport.artifactScore.score * 0.6 + (revenueForecast.mrr > 0 ? 30 : 0)
            ),
            deploymentStatus: validationReport.passed ? "config_generated" : "blocked",
          },
        });
      });

      finishFilesystemSwap(directory, claim.app.id);
      rollbackFilesystem = null;
    } catch (error) {
      if (rollbackFilesystem) {
        try {
          rollbackFilesystem();
        } catch {
          // The DB claim remains failed and recoverable even if local rollback
          // cannot complete. Do not hide the original failure.
        }
      }
      await prisma.app.update({
        where: { id: claim.app.id },
        data: {
          status: "failed",
          lastGenerationError: safeFailureMessage(error),
        },
      }).catch(() => undefined);
      throw error;
    }
  }

  // This downstream call is deliberately outside the local generation
  // transaction. Cash registration is independently idempotent and replayable,
  // so a temporary dependency outage never erases successfully generated work.
  const cashSaasIntegration = await healCashRegistration(input, slug, context);

  const finalApp = await prisma.app.findUniqueOrThrow({ where: { id: claim.app.id } });
  return {
    app: {
      id: finalApp.id,
      name: finalApp.name,
      slug: finalApp.slug,
      port: finalApp.port,
      status: finalApp.status,
      artifactIntegrityScore: finalApp.artifactIntegrityScore,
      estimatedMrr: finalApp.estimatedMrr,
    },
    replayed: claim.replayed || claim.completed,
    directory,
    files: artifacts.files.map((file) => file.path),
    plan: artifacts.plan,
    billingProfile: artifacts.billing,
    validationReport,
    revenueForecast,
    cashSaas: cashSaasIntegration,
  };
}
