import path from "path";

const GENERATED_APPS_DIR = path.resolve(process.cwd(), "generated-apps");

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function safePath(slug: string): string {
  const sanitized = slug.replace(/[^a-z0-9-]/g, "");
  const resolved = path.resolve(GENERATED_APPS_DIR, sanitized);
  if (!resolved.startsWith(GENERATED_APPS_DIR)) {
    throw new Error("Path traversal detected — blocked.");
  }
  return resolved;
}

export function sanitizeForTemplate(input: string): string {
  return input
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$/g, "\\$")
    .replace(/"/g, '\\"');
}

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
}

export function detectHardcodedSecrets(content: string): string[] {
  const patterns = [
    { pattern: /sk_live_[a-zA-Z0-9]{20,}/, name: "Stripe live secret key" },
    { pattern: /sk_test_[a-zA-Z0-9]{20,}/, name: "Stripe test secret key" },
    { pattern: /pk_live_[a-zA-Z0-9]{20,}/, name: "Stripe live public key" },
    { pattern: /pk_test_[a-zA-Z0-9]{20,}/, name: "Stripe test public key" },
    { pattern: /sk-[a-zA-Z0-9]{40,}/, name: "OpenAI API key" },
    { pattern: /ghp_[a-zA-Z0-9]{36,}/, name: "GitHub personal access token" },
    { pattern: /AKIA[A-Z0-9]{16}/, name: "AWS access key" },
  ];

  const found: string[] = [];
  for (const p of patterns) {
    if (p.pattern.test(content)) {
      found.push(p.name);
    }
  }
  return found;
}

export function structuredError(
  status: number,
  message: string,
  details?: unknown
): { error: string; status: number; details?: unknown } {
  return { error: message, status, details };
}
