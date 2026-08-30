export interface EnvVar {
  key: string;
  value: string;
  required: boolean;
  description: string;
}

export function generateEnvVars(app: {
  slug: string;
  port: number;
  revenueMode: string;
  category: string;
}): EnvVar[] {
  const vars: EnvVar[] = [
    {
      key: "PORT",
      value: String(app.port),
      required: true,
      description: "Server port",
    },
    {
      key: "NODE_ENV",
      value: "production",
      required: true,
      description: "Environment mode",
    },
    {
      key: "RUN_API_KEY",
      value: "",
      required: true,
      description: "High-entropy API key required by the protected /run endpoint in production",
    },
    {
      key: "CORS_ORIGINS",
      value: "",
      required: true,
      description: "Comma-separated HTTPS browser origins allowed to call this app; wildcard is rejected in production",
    },
    {
      key: "REQUEST_MAX_BYTES",
      value: "65536",
      required: true,
      description: "Maximum accepted JSON request body size in bytes",
    },
    {
      key: "RATE_LIMIT_PER_MINUTE",
      value: "60",
      required: true,
      description: "Per-client request budget for the protected /run endpoint",
    },
  ];

  if (app.revenueMode !== "free") {
    vars.push(
      {
        key: "STRIPE_SECRET_KEY",
        value: "",
        required: true,
        description: "Stripe secret key for billing",
      },
      {
        key: "STRIPE_PRICE_ID",
        value: "",
        required: true,
        description: "Stripe price ID for subscription tier",
      },
      {
        key: "STRIPE_WEBHOOK_SECRET",
        value: "",
        required: true,
        description: "Stripe webhook signing secret",
      }
    );
  }

  if (
    app.category === "ai-utility" ||
    app.category === "ai-tool" ||
    app.category === "content-engine"
  ) {
    vars.push({
      key: "OPENAI_API_KEY",
      value: "",
      required: false,
      description: "OpenAI API key for AI features when an external provider is enabled",
    });
  }

  return vars;
}

export function generateEnvExample(app: {
  slug: string;
  port: number;
  revenueMode: string;
  category: string;
}): string {
  const vars = generateEnvVars(app);
  const lines = vars.map((v) => {
    const required = v.required ? "(required)" : "(optional)";
    return `# ${v.description} ${required}\n${v.key}=${v.value}`;
  });
  return lines.join("\n\n") + "\n";
}
