export interface RailwayConfig {
  build: { builder: string; buildCommand: string };
  deploy: { startCommand: string; healthcheckPath: string; restartPolicyType: string };
  environments: Record<string, Record<string, string>>;
}

export function generateRailwayConfig(app: {
  slug: string;
  port: number;
  revenueMode: string;
}): RailwayConfig {
  const envVars: Record<string, string> = {
    NODE_ENV: "production",
    PORT: String(app.port),
  };

  if (app.revenueMode !== "free") {
    envVars.STRIPE_PRICE_ID = "";
    envVars.STRIPE_SECRET_KEY = "";
  }

  return {
    build: {
      builder: "DOCKERFILE",
      buildCommand: "npm run build",
    },
    deploy: {
      startCommand: "npm start",
      healthcheckPath: "/health",
      restartPolicyType: "ON_FAILURE",
    },
    environments: {
      production: envVars,
    },
  };
}

export function generateRailwayToml(app: {
  slug: string;
  port: number;
  revenueMode: string;
}): string {
  const config = generateRailwayConfig(app);
  return `[build]
builder = "${config.build.builder}"
buildCommand = "${config.build.buildCommand}"

[deploy]
startCommand = "${config.deploy.startCommand}"
healthcheckPath = "${config.deploy.healthcheckPath}"
restartPolicyType = "${config.deploy.restartPolicyType}"
`;
}
