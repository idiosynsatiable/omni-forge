export interface VercelConfig {
  version: number;
  name: string;
  builds: Array<{ src: string; use: string }>;
  routes: Array<{ src: string; dest: string }>;
  env: Record<string, string>;
}

export function generateVercelConfig(app: {
  slug: string;
  port: number;
  revenueMode: string;
}): VercelConfig {
  return {
    version: 2,
    name: app.slug,
    builds: [
      { src: "server.ts", use: "@vercel/node" },
    ],
    routes: [
      { src: "/health", dest: "/server.ts" },
      { src: "/run", dest: "/server.ts" },
      { src: "/api/(.*)", dest: "/server.ts" },
      { src: "/(.*)", dest: "/server.ts" },
    ],
    env: {
      NODE_ENV: "production",
      PORT: String(app.port),
      ...(app.revenueMode !== "free" ? { STRIPE_PRICE_ID: "@stripe-price-id" } : {}),
    },
  };
}

export function generateVercelConfigFile(app: {
  slug: string;
  port: number;
  revenueMode: string;
}): string {
  return JSON.stringify(generateVercelConfig(app), null, 2);
}
