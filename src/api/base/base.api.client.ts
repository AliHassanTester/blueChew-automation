import { APIRequestContext, APIResponse, TestInfo, expect } from '@playwright/test';
import Ajv, { Schema } from 'ajv';
import addFormats from 'ajv-formats';
import * as allure from 'allure-js-commons';

const ajv = new Ajv({ allErrors: true, coerceTypes: true });
addFormats(ajv);

export interface ApiRequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  data?: unknown;
  timeout?: number;
  failOnStatusCode?: boolean;
}

export interface ApiResponseWrapper<T = unknown> {
  status: number;
  statusText: string;
  ok: boolean;
  headers: Record<string, string>;
  body: T;
  rawText: string;
  durationMs: number;
  rawResponse: APIResponse;
}

/**
 * BaseApiClient
 *
 * Enterprise base client wrapping Playwright's APIRequestContext.
 * Provides:
 *  - Automatic performance benchmarking / latency measurement
 *  - Structured console logging for all requests and responses
 *  - Allure report attachment integration (Request Body, Response Body, Headers, Timing)
 *  - Status code verification & assertion helpers
 *  - JSON Schema validation via AJV
 *  - Centralized authentication token header injection
 */
export class BaseApiClient {
  protected defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  constructor(
    protected readonly requestContext: APIRequestContext,
    protected readonly baseURL: string = '',
    protected readonly testInfo?: TestInfo,
  ) {}

  /**
   * Sets a Bearer token for subsequent requests from this client instance.
   */
  setAuthToken(token: string): this {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
    return this;
  }

  /**
   * Sets custom default headers for this client instance.
   */
  setDefaultHeader(name: string, value: string): this {
    this.defaultHeaders[name] = value;
    return this;
  }

  /**
   * Core request executor with timing, logging, and Allure report attachments.
   */
  async execute<T = unknown>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD',
    endpoint: string,
    options: ApiRequestOptions = {},
  ): Promise<ApiResponseWrapper<T>> {
    const fullUrl = this.buildUrl(endpoint);
    const headers = { ...this.defaultHeaders, ...options.headers };
    const startTime = Date.now();

    console.log(`[API Request] ${method} -> ${fullUrl}`);
    if (options.data) {
      console.log(`[API Request Body]`, JSON.stringify(options.data, null, 2));
    }

    let rawResponse: APIResponse;
    try {
      rawResponse = await this.requestContext.fetch(fullUrl, {
        method,
        headers,
        params: options.params,
        data: options.data,
        timeout: options.timeout ?? 30_000,
        failOnStatusCode: options.failOnStatusCode ?? false,
      });
    } catch (error: any) {
      const durationMs = Date.now() - startTime;
      console.error(`[API Error] ${method} ${fullUrl} failed after ${durationMs}ms:`, error.message || error);
      throw error;
    }

    const durationMs = Date.now() - startTime;
    const status = rawResponse.status();
    const statusText = rawResponse.statusText();
    const rawText = await rawResponse.text();
    const responseHeaders = rawResponse.headers();

    let body: T;
    try {
      body = rawText ? (JSON.parse(rawText) as T) : ({} as T);
    } catch {
      body = rawText as unknown as T;
    }

    console.log(`[API Response] ${method} <- ${status} ${statusText} (${durationMs}ms) [${fullUrl}]`);

    // Attach request/response details to Allure and Playwright TestInfo
    await this.attachToReport(method, fullUrl, options, status, body, durationMs);

    return {
      status,
      statusText,
      ok: rawResponse.ok(),
      headers: responseHeaders,
      body,
      rawText,
      durationMs,
      rawResponse,
    };
  }

  // ── Convenience HTTP Methods ───────────────────────────────────────────────

  async get<T = unknown>(endpoint: string, options?: ApiRequestOptions): Promise<ApiResponseWrapper<T>> {
    return this.execute<T>('GET', endpoint, options);
  }

  async post<T = unknown>(endpoint: string, data?: unknown, options?: Omit<ApiRequestOptions, 'data'>): Promise<ApiResponseWrapper<T>> {
    return this.execute<T>('POST', endpoint, { ...options, data });
  }

  async put<T = unknown>(endpoint: string, data?: unknown, options?: Omit<ApiRequestOptions, 'data'>): Promise<ApiResponseWrapper<T>> {
    return this.execute<T>('PUT', endpoint, { ...options, data });
  }

  async patch<T = unknown>(endpoint: string, data?: unknown, options?: Omit<ApiRequestOptions, 'data'>): Promise<ApiResponseWrapper<T>> {
    return this.execute<T>('PATCH', endpoint, { ...options, data });
  }

  async delete<T = unknown>(endpoint: string, options?: ApiRequestOptions): Promise<ApiResponseWrapper<T>> {
    return this.execute<T>('DELETE', endpoint, options);
  }

  // ── Assertions & Schema Validation Helpers ─────────────────────────────────

  /**
   * Asserts the response status matches the expected HTTP status code.
   */
  assertStatus(response: ApiResponseWrapper, expectedStatus: number): void {
    console.log(`[Assert Status] Expecting ${expectedStatus}, got ${response.status}`);
    expect(response.status, `Expected status ${expectedStatus} but got ${response.status} for URL: ${response.rawResponse.url()}`).toBe(expectedStatus);
  }

  /**
   * Asserts response latency was under the threshold in milliseconds.
   */
  assertResponseTime(response: ApiResponseWrapper, maxDurationMs: number): void {
    console.log(`[Assert Latency] Latency ${response.durationMs}ms <= ${maxDurationMs}ms`);
    expect(response.durationMs, `Expected response time under ${maxDurationMs}ms but was ${response.durationMs}ms`).toBeLessThanOrEqual(maxDurationMs);
  }

  /**
   * Validates the response body matches a given JSON Schema using AJV.
   */
  validateSchema(schema: Schema, data: unknown): boolean {
    const validate = ajv.compile(schema);
    const valid = validate(data);
    if (!valid) {
      const errorMsg = `[AJV Schema Error] ${JSON.stringify(validate.errors, null, 2)}`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
    console.log(`[AJV Schema] JSON schema validation passed successfully`);
    return true;
  }

  // ── Private Helpers ────────────────────────────────────────────────────────

  private buildUrl(endpoint: string): string {
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return endpoint;
    }
    const cleanBase = this.baseURL.replace(/\/+$/, '');
    const cleanEndpoint = endpoint.replace(/^\/+/, '');
    return cleanBase ? `${cleanBase}/${cleanEndpoint}` : endpoint;
  }

  private async attachToReport(
    method: string,
    url: string,
    options: ApiRequestOptions,
    status: number,
    responseBody: unknown,
    durationMs: number,
  ): Promise<void> {
    const reportData = {
      request: {
        method,
        url,
        headers: options.headers,
        params: options.params,
        data: options.data,
      },
      response: {
        status,
        durationMs,
        body: responseBody,
      },
    };

    if (this.testInfo) {
      await this.testInfo.attach(`[API] ${method} ${url} (${status})`, {
        body: JSON.stringify(reportData, null, 2),
        contentType: 'application/json',
      });
    }

    try {
      await allure.attachment(
        `API: ${method} ${url} [${status}] (${durationMs}ms)`,
        JSON.stringify(reportData, null, 2),
        'application/json',
      );
    } catch {
      // Ignored if allure runtime is inactive
    }
  }
}
