import { describe, it, expect } from "vitest";
import {
  computeTemperatureStats,
  calculateDeviceFreshness,
  getHistoryCutoffDate,
} from "../telemetry";

describe("computeTemperatureStats", () => {
  it("computes min, max, avg correctly for numbers", () => {
    const readings = [
      { temperatureC: 20.0 },
      { temperatureC: 25.0 },
      { temperatureC: 30.0 },
    ];
    const stats = computeTemperatureStats(readings);
    expect(stats.min).toBe(20.0);
    expect(stats.max).toBe(30.0);
    expect(stats.avg).toBe(25.0);
    expect(stats.count).toBe(3);
  });

  it("handles empty reading list gracefully", () => {
    const stats = computeTemperatureStats([]);
    expect(stats.min).toBeNull();
    expect(stats.max).toBeNull();
    expect(stats.avg).toBeNull();
    expect(stats.count).toBe(0);
  });

  it("handles single reading correctly", () => {
    const stats = computeTemperatureStats([{ temperatureC: 23.45 }]);
    expect(stats.min).toBe(23.45);
    expect(stats.max).toBe(23.45);
    expect(stats.avg).toBe(23.45);
    expect(stats.count).toBe(1);
  });
});

describe("calculateDeviceFreshness", () => {
  const now = 1700000000000;

  it("returns awaiting_first_reading when date is null or invalid", () => {
    expect(calculateDeviceFreshness(null, now)).toBe("awaiting_first_reading");
    expect(calculateDeviceFreshness(undefined, now)).toBe("awaiting_first_reading");
    expect(calculateDeviceFreshness("invalid-date", now)).toBe("awaiting_first_reading");
  });

  it("returns live when reading is <= 60 seconds old", () => {
    const thirtySecsAgo = new Date(now - 30 * 1000).toISOString();
    expect(calculateDeviceFreshness(thirtySecsAgo, now)).toBe("live");

    const sixtySecsAgo = new Date(now - 60 * 1000).toISOString();
    expect(calculateDeviceFreshness(sixtySecsAgo, now)).toBe("live");
  });

  it("returns delayed when reading is between 61s and 1 hour old", () => {
    const fiveMinsAgo = new Date(now - 5 * 60 * 1000).toISOString();
    expect(calculateDeviceFreshness(fiveMinsAgo, now)).toBe("delayed");

    const fiftyNineMinsAgo = new Date(now - 59 * 60 * 1000).toISOString();
    expect(calculateDeviceFreshness(fiftyNineMinsAgo, now)).toBe("delayed");
  });

  it("returns stale when reading is older than 1 hour", () => {
    const twoHoursAgo = new Date(now - 2 * 60 * 60 * 1000).toISOString();
    expect(calculateDeviceFreshness(twoHoursAgo, now)).toBe("stale");
  });
});

describe("getHistoryCutoffDate", () => {
  it("calculates cutoff dates correctly for ranges", () => {
    const now = Date.now();
    const cutoff1h = getHistoryCutoffDate("1h").getTime();
    expect(Math.abs(now - cutoff1h - 3600000)).toBeLessThan(100);

    const cutoff24h = getHistoryCutoffDate("24h").getTime();
    expect(Math.abs(now - cutoff24h - 86400000)).toBeLessThan(100);

    const cutoff7d = getHistoryCutoffDate("7d").getTime();
    expect(Math.abs(now - cutoff7d - 7 * 86400000)).toBeLessThan(100);
  });
});
