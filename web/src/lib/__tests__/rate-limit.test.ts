import { describe, it, expect, beforeEach } from "vitest";
import { ingestionRateLimiter } from "../rate-limit";

describe("SlidingWindowRateLimiter", () => {
  beforeEach(() => {
    ingestionRateLimiter.reset();
  });

  it("allows requests within configured limit", () => {
    const key = "test-device-1";
    for (let i = 0; i < 30; i++) {
      const result = ingestionRateLimiter.check(key);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(30 - (i + 1));
    }
  });

  it("blocks requests exceeding limit and reports remaining 0", () => {
    const key = "test-device-2";
    for (let i = 0; i < 30; i++) {
      ingestionRateLimiter.check(key);
    }

    const blocked = ingestionRateLimiter.check(key);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.resetMs).toBeGreaterThan(0);
  });

  it("tracks rate limits per key independently", () => {
    const devA = "device-a";
    const devB = "device-b";

    for (let i = 0; i < 30; i++) {
      ingestionRateLimiter.check(devA);
    }

    expect(ingestionRateLimiter.check(devA).allowed).toBe(false);
    expect(ingestionRateLimiter.check(devB).allowed).toBe(true);
  });
});
