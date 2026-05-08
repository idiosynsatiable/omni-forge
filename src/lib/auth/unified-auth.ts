/**
 * UNIFIED AUTH — Cross-Service Authentication
 * 
 * Validates JWT tokens issued by cash-saas-core-v2.
 * Provides middleware for Next.js API routes and pages.
 * 
 * Auth flow:
 * 1. User logs in via Cash-SaaS → gets JWT
 * 2. Frontend stores JWT in cookie/localStorage
 * 3. Omni-Forge API routes validate JWT against Cash-SaaS
 * 4. User identity + org + plan available in all routes
 */

import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';

const CASH_SAAS_URL = process.env.CASH_SAAS_CORE_URL || 'http://localhost:8000';
const JWT_SECRET = process.env.JWT_SECRET || process.env.CASH_SAAS_JWT_SECRET || 'production_secure_secret_key_32chars_min_omniforge';
const JWT_ALGORITHM = 'HS256';

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  organization_id: number | null;
  plan_key: string;
  role: string;
}

export interface AuthResult {
  authenticated: boolean;
  user: AuthUser | null;
  error: string | null;
  token: string | null;
}

/**
 * Validate a JWT token locally (same secret as Cash-SaaS)
 */
export async function validateToken(token: string): Promise<AuthResult> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret, { algorithms: [JWT_ALGORITHM] });

    return {
      authenticated: true,
      user: {
        id: payload.sub ? parseInt(payload.sub as string) : 0,
        email: (payload.email as string) || '',
        name: (payload.name as string) || '',
        organization_id: (payload.org_id as number) || null,
        plan_key: (payload.plan as string) || 'free',
        role: (payload.role as string) || 'member',
      },
      error: null,
      token,
    };
  } catch (localErr) {
    // Fallback: validate against Cash-SaaS /auth/me endpoint
    try {
      const resp = await fetch(`${CASH_SAAS_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resp.ok) {
        const data = await resp.json();
        return {
          authenticated: true,
          user: {
            id: data.id,
            email: data.email,
            name: data.name || data.email.split('@')[0],
            organization_id: data.organization_id || null,
            plan_key: data.plan_key || 'free',
            role: data.role || 'member',
          },
          error: null,
          token,
        };
      }
      return { authenticated: false, user: null, error: 'Invalid token', token: null };
    } catch {
      return { authenticated: false, user: null, error: 'Auth service unreachable', token: null };
    }
  }
}

/**
 * Extract token from request (Bearer header or cookie)
 */
export function extractToken(request: NextRequest): string | null {
  // Check Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  // Check cookie
  const cookie = request.cookies.get('omni_token');
  if (cookie?.value) {
    return cookie.value;
  }
  return null;
}

/**
 * Auth middleware for API routes
 * Usage: const auth = await requireAuth(request);
 */
export async function requireAuth(request: NextRequest): Promise<AuthResult> {
  const token = extractToken(request);
  if (!token) {
    return { authenticated: false, user: null, error: 'No token provided', token: null };
  }
  return validateToken(token);
}

/**
 * Login via Cash-SaaS and get a token
 */
export async function login(email: string, password: string): Promise<AuthResult> {
  try {
    const resp = await fetch(`${CASH_SAAS_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!resp.ok) {
      const data = await resp.json().catch(() => ({}));
      return { authenticated: false, user: null, error: data.detail?.message || 'Login failed', token: null };
    }
    const data = await resp.json();
    const token = data.access_token;
    return validateToken(token);
  } catch (err) {
    return { authenticated: false, user: null, error: 'Auth service unreachable', token: null };
  }
}

/**
 * Register via Cash-SaaS
 */
export async function register(email: string, password: string, name: string): Promise<AuthResult> {
  try {
    const resp = await fetch(`${CASH_SAAS_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });
    if (!resp.ok) {
      const data = await resp.json().catch(() => ({}));
      return { authenticated: false, user: null, error: data.detail?.message || 'Registration failed', token: null };
    }
    // Auto-login after register
    return login(email, password);
  } catch (err) {
    return { authenticated: false, user: null, error: 'Auth service unreachable', token: null };
  }
}

/**
 * Protect an API route handler
 */
export function withAuth(handler: (request: NextRequest, user: AuthUser) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const auth = await requireAuth(request);
    if (!auth.authenticated || !auth.user) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: 401 }
      );
    }
    return handler(request, auth.user);
  };
}
