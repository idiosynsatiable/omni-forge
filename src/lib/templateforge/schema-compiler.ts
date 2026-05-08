export interface AppSchema {
  name: string;
  slug: string;
  description: string;
  category: string;
  revenueMode: string;
  priceMonthly: number;
  requiredFiles: string[];
  requiredEndpoints: string[];
  requiredEnvVars: string[];
  billingFields: string[];
  deploymentFields: string[];
}

const REQUIRED_FILES_BASE = [
  "package.json",
  "README.md",
  ".env.example",
  "server.ts",
  "Dockerfile",
];

const REQUIRED_ENDPOINTS = ["/health", "/run"];

const REQUIRED_ENV_VARS = ["PORT", "NODE_ENV"];

const BILLING_FIELDS = [
  "revenueMode",
  "freeTier",
  "paidTierName",
  "paidTierPrice",
  "usageBillingEnabled",
  "usageUnit",
  "usageUnitPrice",
  "stripePriceIdEnvName",
  "checkoutRoute",
  "webhookRoute",
];

const DEPLOYMENT_FIELDS = [
  "provider",
  "buildCommand",
  "startCommand",
  "port",
  "envVars",
  "healthEndpoint",
];

export function compileSchema(input: {
  name: string;
  slug: string;
  description: string;
  category: string;
  revenueMode: string;
  priceMonthly: number;
}): AppSchema {
  const requiredEnvVars = [...REQUIRED_ENV_VARS];

  if (input.revenueMode !== "free") {
    requiredEnvVars.push("STRIPE_PRICE_ID");
  }

  return {
    name: input.name,
    slug: input.slug,
    description: input.description,
    category: input.category,
    revenueMode: input.revenueMode,
    priceMonthly: input.priceMonthly,
    requiredFiles: [...REQUIRED_FILES_BASE],
    requiredEndpoints: [...REQUIRED_ENDPOINTS],
    requiredEnvVars,
    billingFields: [...BILLING_FIELDS],
    deploymentFields: [...DEPLOYMENT_FIELDS],
  };
}

export function validateAgainstSchema(
  schema: AppSchema,
  files: Array<{ path: string; content: string }>
): { valid: boolean; missing: string[]; extra: string[] } {
  const filePaths = files.map((f) => f.path.split("/").pop() || f.path);
  const missing = schema.requiredFiles.filter(
    (req) => !filePaths.some((fp) => fp === req)
  );
  const extra = filePaths.filter(
    (fp) => !schema.requiredFiles.includes(fp)
  );

  return {
    valid: missing.length === 0,
    missing,
    extra,
  };
}
