import { Page, APIRequestContext, APIResponse } from '@playwright/test';
import { Logger } from './Logger';

export type ApiContext = Page | APIRequestContext;
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface ApiRequestOptions {
    url: string;
    method: HttpMethod;
    headers?: Record<string, string>;
    data?: unknown;
    params?: Record<string, string>;
    timeout?: number;
    /**
     * When true, callApi() throws an ApiResponseError for any non-2xx response
     * instead of silently returning the failed response object.
     * Defaults to true to surface failures early.
     */
    throwOnFailure?: boolean;
}

export interface RetryOptions {
    condition: (response: APIResponse) => Promise<boolean> | boolean;
    pollingInterval?: number;
    retryCount?: number;
}

/**
 * Structured error thrown when an API call returns a non-2xx status and
 * throwOnFailure is true (the default). Preserves the original APIResponse
 * so callers can inspect headers / body if needed.
 */
export class ApiResponseError extends Error {
    public readonly response: APIResponse;
    public readonly statusCode: number;

    constructor(message: string, response: APIResponse) {
        super(message);
        this.name = 'ApiResponseError';
        this.response = response;
        this.statusCode = response.status();
    }
}

export class ApiHelper {
    private context: ApiContext;
    private logger: Logger;

    constructor(context: ApiContext) {
        this.context = context;
        this.logger = Logger.create('ApiHelper');
    }

    /**
     * Get the request object from the context
     */
    private getRequest(): APIRequestContext {
        if ('request' in this.context) {
            return this.context.request;
        }
        return this.context as APIRequestContext;
    }

    /**
     * Build full URL with query parameters
     */
    private buildUrl(url: string, params?: Record<string, string>): string {
        if (!params) return url;
        const searchParams = new URLSearchParams(params);
        return `${url}?${searchParams.toString()}`;
    }

    /**
     * Perform an HTTP API request.
     *
     * By default (throwOnFailure = true) a non-2xx response throws an
     * ApiResponseError with the status code and URL embedded in the message,
     * making test failures immediately visible without needing explicit status
     * assertions everywhere.
     *
     * Set throwOnFailure = false to receive the raw APIResponse and handle
     * status checking yourself (e.g. when testing negative paths).
     */
    async callApi(options: ApiRequestOptions): Promise<APIResponse> {
        const { url, method, headers, data, params, timeout, throwOnFailure = true } = options;
        const request = this.getRequest();
        const fullUrl = this.buildUrl(url, params);

        this.logger.debug(`callApi: ${method} ${fullUrl}`);

        let response: APIResponse;

        try {
            switch (method) {
                case 'GET':
                    response = await request.get(fullUrl, { headers, timeout });
                    break;
                case 'POST':
                    response = await request.post(fullUrl, { headers, data, timeout });
                    break;
                case 'PUT':
                    response = await request.put(fullUrl, { headers, data, timeout });
                    break;
                case 'DELETE':
                    response = await request.delete(fullUrl, { headers, timeout });
                    break;
                case 'PATCH':
                    response = await request.patch(fullUrl, { headers, data, timeout });
                    break;
                default:
                    throw new Error(`Unsupported HTTP method: ${method}`);
            }
        } catch (error) {
            // Network-level errors (DNS failure, connection refused, timeout, etc.)
            this.logger.error(`callApi: network error on ${method} ${fullUrl} — ${(error as Error).message}`);
            throw error;
        }

        const status = response.status();
        const ok = status >= 200 && status < 300;

        if (ok) {
            this.logger.debug(`callApi: ${method} ${fullUrl} -> ${status} OK`);
        } else {
            this.logger.warn(`callApi: ${method} ${fullUrl} -> ${status} (non-2xx)`);

            if (throwOnFailure) {
                // Attempt to include response body in the error message for diagnostics
                let bodySnippet = '';
                try {
                    const text = await response.text();
                    bodySnippet = text.length > 500 ? `${text.slice(0, 500)}...` : text;
                } catch {
                    bodySnippet = '<unable to read response body>';
                }

                throw new ApiResponseError(
                    `API call failed: ${method} ${fullUrl} returned HTTP ${status}. Body: ${bodySnippet}`,
                    response,
                );
            }
        }

        return response;
    }

    /**
     * Call API with retry logic.
     * Logs each attempt so flaky external services are easy to diagnose.
     */
    async callApiWithRetry(
        options: ApiRequestOptions,
        retryOptions: RetryOptions,
    ): Promise<APIResponse> {
        const { condition, pollingInterval = 5000, retryCount = 3 } = retryOptions;
        // Never throw on failure inside the retry loop — we check the condition manually
        const optionsWithoutThrow: ApiRequestOptions = { ...options, throwOnFailure: false };
        let lastResponse: APIResponse | null = null;

        for (let attempt = 1; attempt <= retryCount; attempt++) {
            this.logger.debug(`callApiWithRetry: attempt ${attempt}/${retryCount} — ${options.method} ${options.url}`);

            lastResponse = await this.callApi(optionsWithoutThrow);

            if (await condition(lastResponse)) {
                this.logger.debug(`callApiWithRetry: condition met on attempt ${attempt}`);
                return lastResponse;
            }

            this.logger.warn(
                `callApiWithRetry: attempt ${attempt}/${retryCount} condition not met ` +
                `(status=${lastResponse.status()}); ` +
                `${attempt < retryCount ? `retrying in ${pollingInterval}ms` : 'giving up'}`,
            );

            if (attempt < retryCount) {
                await new Promise(resolve => setTimeout(resolve, pollingInterval));
            }
        }

        this.logger.error(
            `callApiWithRetry: all ${retryCount} attempt(s) exhausted for ${options.method} ${options.url}`,
        );
        return lastResponse!;
    }

    /**
     * Convenience method for GET requests
     */
    async get(url: string, options?: Omit<ApiRequestOptions, 'url' | 'method'>): Promise<APIResponse> {
        return this.callApi({ url, method: 'GET', ...options });
    }

    /**
     * Convenience method for POST requests
     */
    async post(url: string, data?: unknown, options?: Omit<ApiRequestOptions, 'url' | 'method' | 'data'>): Promise<APIResponse> {
        return this.callApi({ url, method: 'POST', data, ...options });
    }

    /**
     * Convenience method for PUT requests
     */
    async put(url: string, data?: unknown, options?: Omit<ApiRequestOptions, 'url' | 'method' | 'data'>): Promise<APIResponse> {
        return this.callApi({ url, method: 'PUT', data, ...options });
    }

    /**
     * Convenience method for DELETE requests
     */
    async delete(url: string, options?: Omit<ApiRequestOptions, 'url' | 'method'>): Promise<APIResponse> {
        return this.callApi({ url, method: 'DELETE', ...options });
    }

    /**
     * Convenience method for PATCH requests
     */
    async patch(url: string, data?: unknown, options?: Omit<ApiRequestOptions, 'url' | 'method' | 'data'>): Promise<APIResponse> {
        return this.callApi({ url, method: 'PATCH', data, ...options });
    }

    /**
     * Parse JSON response with type safety
     */
    async parseJsonResponse<T>(response: APIResponse): Promise<T> {
        try {
            return await response.json() as T;
        } catch (error) {
            this.logger.error(`parseJsonResponse: failed to parse JSON from status=${response.status()} — ${(error as Error).message}`);
            throw error;
        }
    }

    /**
     * Check if response is successful (2xx status)
     */
    isSuccess(response: APIResponse): boolean {
        const status = response.status();
        return status >= 200 && status < 300;
    }
}
