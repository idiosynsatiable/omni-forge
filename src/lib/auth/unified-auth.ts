/**
 * UNIFIED AUTH — server-authoritative cross-service authentication.
 *
 * Omni-Forge deliberately does NOT possess Cash-SaaS's JWT signing secret.
 * Every presented token is introspected against Cash-SaaS `/auth/me`, so
 * revocation, role changes, plan changes, and tenant membership changes take
 * effect immediately at the trust boundary.
 */

import { NextRequest, NextResponse } from "next/server";

const CASH_SAAS_URL = process.env.CASH_SAAS_CORE_URL || "http://localhost:8000";
const AUTH_TIMEOUT_MS = 5_000;

export interface AuthOrganization {
  id: number;
  name: string;
  slug: string;
  role: string;
  plan_key: string;
  subscription_status: string;
}

export interface AuthUser {
  id: number;
  email: string;
  is_admin: boolean;
  organizations: AuthOrganization[];
  default_organization_id: number | null;
}

export interface AuthResult {
  authenticated: boolean;
  user: AuthUser | null;
  error: string | null;
  token: string | null;
}

export interface OrganizationAuthResult extends AuthResult {
  organization: AuthOrganization | null;
  status: number;
}

function assertAuthServiceUrl(): void {
  let parsed: URL;
  try {
    parsed = new URL(CASH_SAAS_URL);
  } catch {
    throw new Error("CASH_SAAS_CORE_URL must be an absolute URL");
  }

  if (process.env.NODE_ENV === "production" && parsed.protocol !== "https:") {
    throw new Error("CASH_SAAS_CORE_URL must use https in production");
  }
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AUTH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      cache: "no-store",
    });
  } finally {
    clearTimeout(timer);
  }
}

function normalizeOrganizations(value: unknown): AuthOrganization[] {
  if (!Array.isArray(value)) return [];
  const result: AuthOrganization[] = [];
  for (const candidate of value) {
    if (!candidate || typeof candidate !== "object") continue;
    const row = candidate as Record<string, unknown>;
    const id = Number(row.id);
    if (!Number.isSafeInteger(id) || id <= 0) continue;
    result.push({
      id,
      name: typeof row.name === "string" ? row.name : "",
      slug: typeof row.slug === "string" ? row.slug : "",
      role: typeof row.role === "string" ? row.role : "viewer",
      plan_key: typeof row.plan_key === "string" ? row.plan_key : "free",
      subscription_status:
        typeof row.subscription_status === "string" ? row.subscription_status : "free",
    });
  }
  return result;
}

/** Validate a Cash-SaaS bearer token against the current server-side state. */
export async function validateToken(token: string): Promise<AuthResult> {
  try {
    assertAuthServiceUrl();
    const resp = await fetchWithTimeout(`${CASH_SAAS_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!resp.ok) {
      return { authenticated: false, user: null, error: "Invalid token", token: null };
    }

    const data = (await resp.json()) as Record<string, unknown>;
    const id = Number(data.id);
    const email = typeof data.email === "string" ? data.email : "";
    if (!Number.isSafeInteger(id) || id <= 0 || !email) {
      return {
        authenticated: false,
        user: null,
        error: "Auth authority returned an invalid identity payload",
        token: null,
      };
    }

    const organizations = normalizeOrganizations(data.organizations);
    const defaultOrganizationId = Number(data.default_organization_id);

    return {
      authenticated: true,
      user: {
        id,
        email,
        is_admin: data.is_admin === true,
        organizations,
        default_organization_id:
          Number.isSafeInteger(defaultOrganizationId) && defaultOrganizationId > 0
            ? defaultOrganizationId
            : null,
      },
      error: null,
      token,
    };
  } catch (error) {
    const message = error instanceof Error && error.name === "AbortError"
      ? "Auth service timed out"
      : "Auth service unreachable or misconfigured";
    return { authenticated: false, user: null, error: message, token: null };
  }
}

/** Extract token from Authorization header or the HttpOnly Omni cookie. */
export function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    return token || null;
  }
  const cookie = request.cookies.get("omni_token");
  return cookie?.value || null;
}

export async function requireAuth(request: NextRequest): Promise<AuthResult> {
  const token = extractToken(request);
  if (!token) {
    return { authenticated: false, user: null, error: "No token provided", token: null };
  }
  return validateToken(token);
}

/**
 * Resolve explicit tenant context and prove the current user still belongs to it.
 * If a user has exactly one organization, callers may omit x-organization-id.
 * Multi-tenant users must select one explicitly so no "first org wins" bug can
 * cross a tenant boundary.
 */
export async function requireOrganization(
  request: NextRequest,
  allowedRoles: readonly string[] = []
): Promise<OrganizationAuthResult> {
  const auth = await requireAuth(request);
  if (!auth.authenticated || !auth.user || !auth.token) {
    return { ...auth, organization: null, status: 401 };
  }

  const organizations = auth.user.organizations;
  const requested = request.headers.get("x-organization-id")?.trim();

  let organizationId: number | null = null;
  if (requested) {
    const parsed = Number(requested);
    if (!Number.isSafeInteger(parsed) || parsed <= 0) {
      return {
        ...auth,
        authenticated: false,
        error: "Invalid x-organization-id",
        organization: null,
        status: 400,
      };
    }
    organizationId = parsed;
  } else if (organizations.length === 1) {
    organizationId = organizations[0].id;
  } else {
    return {
      ...auth,
      authenticated: false,
      error: organizations.length === 0
        ? "No organization access"
        : "x-organization-id is required when multiple organizations are available",
      organization: null,
      status: organizations.length === 0 ? 403 : 400,
    };
  }

  const organization = organizations.find((org) => org.id === organizationId) || null;
  if (!organization) {
    return {
      ...auth,
      authenticated: false,
      error: "Organization access denied",
      organization: null,
      status: 403,
    };
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(organization.role)) {
    return {
      ...auth,
      authenticated: false,
      error: "Organization role does not permit this operation",
      organization: null,
      status: 403,
    };
  }

  return { ...auth, organization, status: 200 };
}

/** Login via Cash-SaaS and validate the returned token against `/auth/me`. */
export async function login(email: string, password: string): Promise<AuthResult> {
  try {
    assertAuthServiceUrl();
    const resp = await fetchWithTimeout(`${CASH_SAAS_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!resp.ok) {
      const data = await resp.json().catch(() => ({})) as { detail?: { message?: string } };
      return {
        authenticated: false,
        user: null,
        error: data.detail?.message || "Login failed",
        token: null,
      };
    }
    const data = await resp.json() as { access_token?: string };
    if (!data.access_token) {
      return { authenticated: false, user: null, error: "Auth service returned no token", token: null };
    }
    return validateToken(data.access_token);
  } catch {
    return { authenticated: false, user: null, error: "Auth service unreachable", token: null };
  }
}

/** Register via Cash-SaaS, then establish a normal authenticated session. */
export async function register(email: string, password: string, name: string): Promise<AuthResult> {
  void name; // Cash-SaaS currently owns identity without a display-name field.
  try {
    assertAuthServiceUrl();
    const resp = await fetchWithTimeout(`${CASH_SAAS_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email, password, name }),
    });
    if (!resp.ok) {
      const data = await resp.json().catch(() => ({})) as { detail?: { message?: string } };
      return {
        authenticated: false,
        user: null,
        error: data.detail?.message || "Registration failed",
        token: null,
      };
    }
    const data = await resp.json() as { access_token?: string };
    if (!data.access_token) {
      return { authenticated: false, user: null, error: "Auth service returned no token", token: null };
    }
    return validateToken(data.access_token);
  } catch {
    return { authenticated: false, user: null, error: "Auth service unreachable", token: null };
  }
}

export function withAuth(handler: (request: NextRequest, user: AuthUser) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const auth = await requireAuth(request);
    if (!auth.authenticated || !auth.user) {
      return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 401 });
    }
    return handler(request, auth.user);
  };
}
