import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../route";

vi.mock("@/lib/telemetry", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/telemetry")>();
  return {
    ...actual,
    getHistoricalReadings: vi.fn(),
  };
});

import { getHistoricalReadings } from "@/lib/telemetry";

describe("GET /api/telemetry/history", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unsupported range parameter (400)", async () => {
    const req = new NextRequest("http://localhost:3000/api/telemetry/history?range=1month");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.code).toBe("INVALID_RANGE");
  });

  it("returns 200 and empty structure when no readings match the range", async () => {
    vi.mocked(getHistoricalReadings).mockResolvedValue({
      readings: [],
      stats: { min: null, max: null, avg: null, count: 0 },
    });

    const req = new NextRequest("http://localhost:3000/api/telemetry/history?range=24h");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.range).toBe("24h");
    expect(json.data.readings).toEqual([]);
    expect(json.data.stats.count).toBe(0);
    expect(json.data.stats.avg).toBeNull();
  });

  it("returns chronologically sorted readings and calculated statistics for 1h", async () => {
    const mockData = {
      readings: [
        { id: "1", deviceId: "thermoguard-01", temperatureC: 21.0, receivedAt: "2026-10-28T21:00:00Z" },
        { id: "2", deviceId: "thermoguard-01", temperatureC: 23.0, receivedAt: "2026-10-28T21:30:00Z" },
      ],
      stats: { min: 21.0, max: 23.0, avg: 22.0, count: 2 },
    };

    vi.mocked(getHistoricalReadings).mockResolvedValue(mockData);

    const req = new NextRequest("http://localhost:3000/api/telemetry/history?range=1h");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.range).toBe("1h");
    expect(json.data.readings.length).toBe(2);
    expect(json.data.stats.min).toBe(21.0);
    expect(json.data.stats.max).toBe(23.0);
    expect(json.data.stats.avg).toBe(22.0);
  });

  it("handles database query failure with 503 DATABASE_UNAVAILABLE", async () => {
    vi.mocked(getHistoricalReadings).mockRejectedValue(new Error("MongoQueryTimeout"));

    const req = new NextRequest("http://localhost:3000/api/telemetry/history?range=7d");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(503);
    expect(json.error.code).toBe("DATABASE_UNAVAILABLE");
    expect(json.error.retryable).toBe(true);
  });
});
