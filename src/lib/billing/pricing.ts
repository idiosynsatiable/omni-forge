export interface BillingProfile {
  revenueMode: string;
  freeTier: boolean;
  paidTierName: string;
  paidTierPrice: number;
  usageBillingEnabled: boolean;
  usageUnit: string;
  usageUnitPrice: number;
  stripePriceIdEnvName: string;
  checkoutRoute: string;
  webhookRoute: string;
}

export interface PlatformTier {
  name: string;
  slug: string;
  priceMonthly: number;
  features: string[];
}

export const PLATFORM_TIERS: PlatformTier[] = [
  {
    name: "Builder",
    slug: "builder",
    priceMonthly: 19,
    features: [
      "Generate and manage micro-apps",
      "Basic validation",
      "Local deployment package",
      "Up to 5 apps",
      "Community support",
    ],
  },
  {
    name: "Pro",
    slug: "pro",
    priceMonthly: 49,
    features: [
      "Unlimited apps",
      "Revenue intelligence dashboard",
      "Billing templates",
      "Deployment readiness scoring",
      "Priority support",
      "CLI access",
    ],
  },
  {
    name: "Agency",
    slug: "agency",
    priceMonthly: 149,
    features: [
      "Client-ready app generation",
      "White-label exports",
      "Marketplace templates",
      "Advanced validation",
      "App cloning",
      "Agent swarm",
      "Custom branding",
    ],
  },
  {
    name: "Enterprise",
    slug: "enterprise",
    priceMonthly: 0,
    features: [
      "Private deployment",
      "Internal app factory",
      "Audit logs",
      "Organization controls",
      "SLA guarantee",
      "Dedicated support",
      "Custom pricing",
    ],
  },
];

export function generateBillingProfile(app: {
  revenueMode: string;
  priceMonthly: number;
  usageUnitPrice: number;
  slug: string;
}): BillingProfile {
  return {
    revenueMode: app.revenueMode,
    freeTier: app.revenueMode === "freemium" || app.revenueMode === "free",
    paidTierName: `${app.slug}-pro`,
    paidTierPrice: app.priceMonthly,
    usageBillingEnabled: app.revenueMode === "usage",
    usageUnit: app.revenueMode === "usage" ? "request" : "none",
    usageUnitPrice: app.usageUnitPrice,
    stripePriceIdEnvName: `STRIPE_PRICE_${app.slug.toUpperCase().replace(/-/g, "_")}`,
    checkoutRoute: "/api/checkout",
    webhookRoute: "/api/webhooks/stripe",
  };
}
