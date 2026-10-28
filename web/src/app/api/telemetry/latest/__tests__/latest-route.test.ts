import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../route";

vi.mock("@/lib/telemetry", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/telemetry")>();
  return {
    ...actual,
    getLatestReading: vi.fn(),
    getDeviceSettings: vi.fn(),
  };
});

import { getLatestReading, getDeviceSettings } from "@/lib/telemetry";

describe("GET /api/telemetry/latest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns awaiting_first_reading when no readings have ever been stored", async () => {
    vi.mocked(getLatestReading).mockResolvedValue(null);
    vi.mocked(getDeviceSettings).mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/telemetry/latest");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.reading).toBeNull();
    expect(json.data.freshnessStatus).toBe("awaiting_first_reading");
    expect(json.data.ageSeconds).toBeNull();
    expect(res.headers.get("Cache-Control")).toContain("no-store");
  });

  it("returns latest reading and live freshness when reading is recent", async () => {
    const thirtySecsAgo = new Date(Date.now() - 30 * 1000).toISOString();
    vi.mocked(getLatestReading).mockResolvedValue({
      id: "reading-123",
      deviceId: "thermoguard-01",
      temperatureC: 23.4,
      receivedAt: thirtySecsAgo,
    });
    vi.mocked(getDeviceSettings).mockResolvedValue({
      deviceId: "thermoguard-01",
      minTemperatureC: 18,
      maxTemperatureC: 28,
      updatedAt: new Date(),
    });

    const req = new NextRequest("http://localhost:3000/api/telemetry/latest");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.reading.temperatureC).toBe(23.4);
    expect(json.data.freshnessStatus).toBe("live");
    expect(json.data.ageSeconds).toBeGreaterThanOrEqual(29);
    expect(json.data.thresholdViolation).toBeNull();
  });

  it("flags high threshold violation when temperature exceeds max setting", async () => {
    vi.mocked(getLatestReading).mockResolvedValue({
      id: "reading-124",
      deviceId: "thermoguard-01",
      temperatureC: 32.5,
      receivedAt: new Date().toISOString(),
    });
    vi.mocked(getDeviceSettings).mockResolvedValue({
      deviceId: "thermoguard-01",
      minTemperatureC: 18,
      maxTemperatureC: 28,
      updatedAt: new Date(),
    });

    const req = new NextRequest("http://localhost:3000/api/telemetry/latest");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.thresholdViolation).toBe("high");
  });

  it("returns 503 DATABASE_UNAVAILABLE on database query failure", async () => {
    vi.mocked(getLatestReading).mockRejectedValue(new Error("MongoNetworkTimeout"));

    const req = new NextRequest("http://localhost:3000/api/telemetry/latest");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(503);
    expect(json.error.code).toBe("DATABASE_UNAVAILABLE");
    expect(json.error.retryable).toBe(true);
  });
});
