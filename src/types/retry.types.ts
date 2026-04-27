import { APIResponse } from '@playwright/test';

/**
 * Shared base retry configuration used by both UI and API retry helpers.
 * Extracted from WaitHelper and ApiHelper to eliminate duplicate interface names.
 */
export interface BaseRetryConfig {
  /** Maximum number of attempts before giving up */
  maxAttempts?: number;
}

/**
 * Retry options for UI actions in WaitHelper.retry().
 * Uses exception-based success detection with a fixed delay between attempts.
 */
export interface UiRetryOptions extends BaseRetryConfig {
  /**
   * Number of times to retry the action.
   * @default 3
   */
  retries?: number;
  /**
   * Delay in milliseconds between retry attempts.
   * @default 1000
   */
  delay?: number;
}

/**
 * Retry options for API calls in ApiHelper.callApiWithRetry().
 * Uses a condition function for success detection with a polling interval.
 */
export interface ApiRetryOptions extends BaseRetryConfig {
  /**
   * Predicate function that evaluates the API response to decide if the call succeeded.
   * Return true to stop retrying, false to retry.
   */
  condition: (response: APIResponse) => Promise<boolean> | boolean;
  /**
   * Interval in milliseconds to wait between retry attempts.
   * @default 5000
   */
  pollingInterval?: number;
  /**
   * Maximum number of retry attempts.
   * @default 3
   */
  retryCount?: number;
}
