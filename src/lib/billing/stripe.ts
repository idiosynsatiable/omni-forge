export interface StripeStatus {
  enabled: boolean;
  provider: string;
  message: string;
  features: string[];
}

export function getStripeStatus(): StripeStatus {
  const hasKey = !!process.env.STRIPE_SECRET_KEY;

  if (!hasKey) {
    return {
      enabled: false,
      provider: "none",
      message: "Billing is disabled. Set STRIPE_SECRET_KEY in your environment to activate.",
      features: [],
    };
  }

  return {
    enabled: true,
    provider: "stripe",
    message: "Stripe billing is active.",
    features: [
      "Subscription billing",
      "Usage metering",
      "Checkout sessions",
      "Webhook processing",
      "Invoice generation",
    ],
  };
}

export function generateStripeCheckoutConfig(app: {
  slug: string;
  priceMonthly: number;
  revenueMode: string;
}): Record<string, unknown> {
  return {
    mode: app.revenueMode === "one-time" ? "payment" : "subscription",
    successUrl: `{APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `{APP_URL}/pricing`,
    lineItems: [
      {
        priceEnvVar: `STRIPE_PRICE_${app.slug.toUpperCase().replace(/-/g, "_")}`,
        quantity: 1,
      },
    ],
    metadata: {
      appSlug: app.slug,
      tier: "pro",
    },
  };
}
