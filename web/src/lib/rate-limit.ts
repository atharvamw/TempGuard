/**
 * Lightweight sliding window rate limiter for IoT device ingestion.
 * Keeps track of timestamps per key (e.g. deviceId or client IP).
 * Automatically evicts stale keys to avoid memory leaks.
 */

interface RateLimitConfig {
  maxRequests: number; // max allowed requests within window
  windowMs: number;    // window size in milliseconds
}

class SlidingWindowRateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(config: RateLimitConfig) {
    this.maxRequests = config.maxRequests;
    this.windowMs = config.windowMs;
  }

  /**
   * Checks if a request is allowed for the given key.
   * Returns { allowed: boolean, remaining: number, resetMs: number }
   */
  public check(key: string): { allowed: boolean; remaining: number; resetMs: number } {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    const timestamps = (this.requests.get(key) || []).filter((ts) => ts > windowStart);

    if (timestamps.length >= this.maxRequests) {
      const oldestTimestamp = timestamps[0];
      const resetMs = Math.max(0, oldestTimestamp + this.windowMs - now);
      return {
        allowed: false,
        remaining: 0,
        resetMs,
      };
    }

    timestamps.push(now);
    this.requests.set(key, timestamps);

    // Evict old entries periodically if map gets large
    if (this.requests.size > 1000) {
      this.cleanup(windowStart);
    }

    return {
      allowed: true,
      remaining: this.maxRequests - timestamps.length,
      resetMs: this.windowMs,
    };
  }

  private cleanup(windowStart: number) {
    for (const [key, timestamps] of this.requests.entries()) {
      const valid = timestamps.filter((ts) => ts > windowStart);
      if (valid.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, valid);
      }
    }
  }

  public reset(key?: string) {
    if (key) {
      this.requests.delete(key);
    } else {
      this.requests.clear();
    }
  }
}

// Default ingestion rate limit: 30 requests per minute per device (normal is 6/min at 10s intervals)
export const ingestionRateLimiter = new SlidingWindowRateLimiter({
  maxRequests: 30,
  windowMs: 60 * 1000,
});
