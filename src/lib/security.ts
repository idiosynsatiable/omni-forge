import path from "path";

const GENERATED_APPS_DIR = path.resolve(process.cwd(), "generated-apps");
const GENERATED_APPS_ROOT = GENERATED_APPS_DIR.endsWith(path.sep)
  ? GENERATED_APPS_DIR
  : `${GENERATED_APPS_DIR}${path.sep}`;

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const MAX_RATE_LIMIT_KEYS = 10_000;

function assertSafeSlug(slug: string): void {
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error("Unsafe app slug");
  }
}

/**
 * Tenant-scoped storage path for generated source.
 *
 * The organization id is part of the physical namespace, so two customers
 * choosing the same app slug cannot overwrite one another even if a caller
 * somehow bypasses a higher-level route guard.
 */
export function safeAppPath(organizationId: number, slug: string): string {
  if (!Number.isSafeInteger(organizationId) || organizationId <= 0) {
    throw new Error("A positive organization id is required for generated-app storage");
  }
  assertSafeSlug(slug);

  const resolved = path.resolve(
    GENERATED_APPS_DIR,
    `org-${organizationId}`,
    slug
  );
  if (!resolved.startsWith(GENERATED_APPS_ROOT)) {
    throw new Error("Path traversal detected and blocked");
  }
  return resolved;
}

/**
 * Legacy single-namespace helper retained for non-customer maintenance paths.
 * Customer generation must use safeAppPath().
 */
export function safePath(slug: string): string {
  assertSafeSlug(slug);
  const resolved = path.resolve(GENERATED_APPS_DIR, slug);
  if (!resolved.startsWith(GENERATED_APPS_ROOT)) {
    throw new Error("Path traversal detected and blocked");
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

function pruneExpiredRateLimits(now: number): void {
  for (const [key, entry] of rateLimitStore) {
    if (entry.resetAt <= now) rateLimitStore.delete(key);
  }

  // The in-process limiter is a local safety valve, not the sole abuse
  // boundary. Keep it bounded so attacker-controlled keys cannot cause an
  // unbounded memory leak on long-lived nodes.
  if (rateLimitStore.size > MAX_RATE_LIMIT_KEYS) {
    const overflow = rateLimitStore.size - MAX_RATE_LIMIT_KEYS;
    let removed = 0;
    for (const key of rateLimitStore.keys()) {
      rateLimitStore.delete(key);
      removed += 1;
      if (removed >= overflow) break;
    }
  }
}

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  if (!key || maxRequests < 1 || windowMs < 1) {
    throw new Error("Invalid rate-limit configuration");
  }

  const now = Date.now();
  if (rateLimitStore.size > MAX_RATE_LIMIT_KEYS || rateLimitStore.size % 250 === 0) {
    pruneExpiredRateLimits(now);
  }

  const entry = rateLimitStore.get(key);
  if (!entry || now >= entry.resetAt) {
    const resetAt = now + windowMs;
    rateLimitStore.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: maxRequests - 1, resetAt };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
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
