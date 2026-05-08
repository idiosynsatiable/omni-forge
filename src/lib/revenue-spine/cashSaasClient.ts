// ============================================================================
// cash-saas-core-v2 API Client — Omni-Forge Phase 3.5
// HTTP client for communicating with the cash-saas-core-v2 backend.
// Reads configuration from environment variables.
// Returns safe disabled-mode responses when env vars are missing.
// ============================================================================

import {
  PlatformCapabilitiesSchema,
  RegisterAppRequestSchema,
  RegisterAppResponseSchema,
  CreateBillingProfileRequestSchema,
  BillingProfileResponseSchema,
  CreateApiProductRequestSchema,
  ApiProductResponseSchema,
  type PlatformCapabilities,
  type RegisterAppRequest,
  type RegisterAppResponse,
  type CreateBillingProfileRequest,
  type BillingProfileResponse,
  type CreateApiProductRequest,
  type ApiProductResponse,
} from "./revenueSpineTypes";

// ── Configuration ───────────────────────────────────────────────────────────

interface CashSaasConfig {
  baseUrl: string;
  adminApiKey: string;
  enabled: boolean;
  timeoutMs: number;
}

function loadConfig(): CashSaasConfig {
  const baseUrl = process.env.CASH_SAAS_CORE_URL ?? "";
  const adminApiKey = process.env.CASH_SAAS_ADMIN_API_KEY ?? "";
  const enabled = Boolean(baseUrl && adminApiKey);
  const timeoutMs = parseInt(process.env.CASH_SAAS_TIMEOUT_MS ?? "10000", 10);

  return { baseUrl: baseUrl.replace(/\/$/, ""), adminApiKey, enabled, timeoutMs };
}

// ── Error Handling ──────────────────────────────────────────────────────────

export class CashSaasClientError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number | null,
    public readonly endpoint: string,
    public readonly responseBody?: string,
  ) {
    super(message);
    this.name = "CashSaasClientError";
  }
}

interface DisabledResult<T> {
  success: false;
  enabled: false;
  reason: string;
  data: null;
}

interface SuccessResult<T> {
  success: true;
  enabled: true;
  data: T;
}

interface ErrorResult {
  success: false;
  enabled: true;
  error: string;
  statusCode: number | null;
  data: null;
}

export type ClientResult<T> = DisabledResult<T> | SuccessResult<T> | ErrorResult;

// ── HTTP Helpers ────────────────────────────────────────────────────────────

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

function disabledResult<T>(reason: string): DisabledResult<T> {
  return { success: false, enabled: false, reason, data: null };
}

function errorResult(error: string, statusCode: number | null = null): ErrorResult {
  return { success: false, enabled: true, error, statusCode, data: null };
}

// ── Client Class ────────────────────────────────────────────────────────────

export class CashSaasClient {
  private config: CashSaasConfig;

  constructor(config?: Partial<CashSaasConfig>) {
    const envConfig = loadConfig();
    this.config = { ...envConfig, ...config };
  }

  get isEnabled(): boolean {
    return this.config.enabled;
  }

  get baseUrl(): string {
    return this.config.baseUrl;
  }

  private headers(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.config.adminApiKey}`,
      "X-Source": "omni-forge",
      "User-Agent": "OmniForge/3.5",
    };
  }

  // ── Platform Health ─────────────────────────────────────────────────────

  async getPlatformCapabilities(): Promise<ClientResult<PlatformCapabilities>> {
    if (!this.config.enabled) {
      return disabledResult("CASH_SAAS_CORE_URL or CASH_SAAS_ADMIN_API_KEY not configured");
    }

    try {
      const url = `${this.config.baseUrl}/omni/platform-capabilities`;
      const response = await fetchWithTimeout(url, { method: "GET", headers: this.headers() }, this.config.timeoutMs);

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        return errorResult(`Platform capabilities request failed: ${response.status}`, response.status);
      }

      const json = await response.json();
      const parsed = PlatformCapabilitiesSchema.safeParse(json);

      if (!parsed.success) {
        return errorResult(`Invalid platform capabilities response: ${parsed.error.message}`);
      }

      return { success: true, enabled: true, data: parsed.data };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("abort")) {
        return errorResult(`Platform capabilities request timed out after ${this.config.timeoutMs}ms`);
      }
      return errorResult(`Platform capabilities request failed: ${msg}`);
    }
  }

  // ── Register Generated App ──────────────────────────────────────────────

  async registerGeneratedApp(request: RegisterAppRequest): Promise<ClientResult<RegisterAppResponse>> {
    if (!this.config.enabled) {
      return disabledResult("Revenue spine disabled — cannot register app");
    }

    const validation = RegisterAppRequestSchema.safeParse(request);
    if (!validation.success) {
      return errorResult(`Invalid request: ${validation.error.message}`);
    }

    try {
      const url = `${this.config.baseUrl}/omni/register-generated-app`;
      const response = await fetchWithTimeout(
        url,
        { method: "POST", headers: this.headers(), body: JSON.stringify(validation.data) },
        this.config.timeoutMs,
      );

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        return errorResult(`Register app failed: ${response.status} — ${body}`, response.status);
      }

      const json = await response.json();
      const parsed = RegisterAppResponseSchema.safeParse(json);

      if (!parsed.success) {
        return errorResult(`Invalid register response: ${parsed.error.message}`);
      }

      return { success: true, enabled: true, data: parsed.data };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return errorResult(`Register app request failed: ${msg}`);
    }
  }

  // ── Create Billing Profile ──────────────────────────────────────────────

  async createBillingProfile(request: CreateBillingProfileRequest): Promise<ClientResult<BillingProfileResponse>> {
    if (!this.config.enabled) {
      return disabledResult("Revenue spine disabled — cannot create billing profile");
    }

    const validation = CreateBillingProfileRequestSchema.safeParse(request);
    if (!validation.success) {
      return errorResult(`Invalid request: ${validation.error.message}`);
    }

    try {
      const url = `${this.config.baseUrl}/omni/create-billing-profile`;
      const response = await fetchWithTimeout(
        url,
        { method: "POST", headers: this.headers(), body: JSON.stringify(validation.data) },
        this.config.timeoutMs,
      );

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        return errorResult(`Create billing profile failed: ${response.status} — ${body}`, response.status);
      }

      const json = await response.json();
      const parsed = BillingProfileResponseSchema.safeParse(json);

      if (!parsed.success) {
        return errorResult(`Invalid billing profile response: ${parsed.error.message}`);
      }

      return { success: true, enabled: true, data: parsed.data };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return errorResult(`Create billing profile request failed: ${msg}`);
    }
  }

  // ── Create API Product ──────────────────────────────────────────────────

  async createApiProduct(request: CreateApiProductRequest): Promise<ClientResult<ApiProductResponse>> {
    if (!this.config.enabled) {
      return disabledResult("Revenue spine disabled — cannot create API product");
    }

    const validation = CreateApiProductRequestSchema.safeParse(request);
    if (!validation.success) {
      return errorResult(`Invalid request: ${validation.error.message}`);
    }

    try {
      const url = `${this.config.baseUrl}/omni/create-api-product`;
      const response = await fetchWithTimeout(
        url,
        { method: "POST", headers: this.headers(), body: JSON.stringify(validation.data) },
        this.config.timeoutMs,
      );

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        return errorResult(`Create API product failed: ${response.status} — ${body}`, response.status);
      }

      const json = await response.json();
      const parsed = ApiProductResponseSchema.safeParse(json);

      if (!parsed.success) {
        return errorResult(`Invalid API product response: ${parsed.error.message}`);
      }

      return { success: true, enabled: true, data: parsed.data };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return errorResult(`Create API product request failed: ${msg}`);
    }
  }
}

// ── Singleton ───────────────────────────────────────────────────────────────

let _instance: CashSaasClient | null = null;

export function getCashSaasClient(): CashSaasClient {
  if (!_instance) {
    _instance = new CashSaasClient();
  }
  return _instance;
}

export function resetCashSaasClient(): void {
  _instance = null;
}
