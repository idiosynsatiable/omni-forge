import { z } from "zod";

export const MARKETPLACE_CATEGORIES = [
  "paid-api",
  "creator-tool",
  "internal-dashboard",
  "ai-utility",
  "seo-tool",
  "resume-career-tool",
  "content-engine",
  "automation-tool",
  "analytics-tool",
] as const;

export const DEPLOYMENT_STATUSES = [
  "not_configured",
  "config_generated",
  "ready",
  "blocked",
  "deployed",
  "failed",
] as const;

export const APP_STATUSES = [
  "draft",
  "planning",
  "generating",
  "generated",
  "validating",
  "validated",
  "deploying",
  "deployed",
  "failed",
] as const;

export const REVENUE_MODES = [
  "freemium",
  "subscription",
  "usage",
  "one-time",
  "free",
] as const;

export const createAppSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().min(5).max(2000),
  category: z.string().default("ai-utility"),
  revenueMode: z.string().default("freemium"),
  priceMonthly: z.number().min(0).max(9999).default(19),
});

export const generateAppSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().min(5).max(2000),
  category: z.string().default("ai-utility"),
  revenueMode: z.string().default("freemium"),
  priceMonthly: z.number().min(0).max(9999).default(19),
  usageUnitPrice: z.number().min(0).max(999).default(0),
});

export const updateAppSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().min(5).max(2000).optional(),
  category: z.string().optional(),
  status: z.string().optional(),
  revenueMode: z.string().optional(),
  priceMonthly: z.number().min(0).max(9999).optional(),
  deploymentStatus: z.string().optional(),
  deploymentProvider: z.string().optional(),
  liveUrl: z.string().optional(),
  marketplaceListed: z.boolean().optional(),
});

export const revenueSimSchema = z.object({
  appId: z.string().optional(),
  visitorsPerMonth: z.number().min(0).default(1000),
  conversionRate: z.number().min(0).max(1).default(0.04),
  churnRate: z.number().min(0).max(1).default(0.05),
  averagePrice: z.number().min(0).default(29),
  grossMargin: z.number().min(0).max(1).default(0.85),
});

export const marketplaceListingSchema = z.object({
  appId: z.string(),
  title: z.string().min(2).max(100),
  description: z.string().min(5).max(2000),
  category: z.string().default("ai-utility"),
  price: z.number().min(0).default(0),
  featured: z.boolean().default(false),
});

export const agentRunSchema = z.object({
  appId: z.string(),
  agents: z.array(z.string()).default(["product", "build", "pricing", "security", "qa", "launch", "growth"]),
});

export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}
