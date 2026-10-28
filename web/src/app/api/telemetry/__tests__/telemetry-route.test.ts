import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../route";
import { ingestionRateLimiter } from "@/lib/rate-limit";

// Mock the telemetry database service
vi.mock("@/lib/telemetry", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/telemetry")>();
  return {
    ...actual,
    recordTemperatureReading: vi.fn(),
  };
});

import { recordTemperatureReading } from "@/lib/telemetry";

describe("POST /api/telemetry", () => {
  const secretToken = "valid-secret-token-xyz";
  const originalEnv = process.env.DEVICE_API_TOKEN;

  beforeEach(() => {
    process.env.DEVICE_API_TOKEN = secretToken;
    ingestionRateLimiter.reset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env.DEVICE_API_TOKEN = originalEnv;
  });

  function makeRequest(body: any, authHeader?: string | null): NextRequest {
    const headers = new Headers();
    if (authHeader !== undefined) {
      if (authHeader) headers.set("Authorization", authHeader);
    } else {
      headers.set("Authorization", `Bearer ${secretToken}`);
    }
    headers.set("Content-Type", "application/json");

    return new NextRequest("http://localhost:3000/api/telemetry", {
      method: "POST",
      headers,
      body: typeof body === "string" ? body : JSON.stringify(body),
    });
  }

  it("rejects requests with missing or invalid authentication token (401)", async () => {
    const reqNoAuth = makeRequest({ deviceId: "thermoguard-01", temperatureC: 22.5 }, null);
    const resNoAuth = await POST(reqNoAuth);
    const jsonNoAuth = await resNoAuth.json();

    expect(resNoAuth.status).toBe(401);
    expect(jsonNoAuth.error.code).toBe("UNAUTHORIZED");

    const reqWrongAuth = makeRequest(
      { deviceId: "thermoguard-01", temperatureC: 22.5 },
      "Bearer wrong-token"
    );
    const resWrongAuth = await POST(reqWrongAuth);
    expect(resWrongAuth.status).toBe(401);
  });

  it("rejects malformed non-JSON payloads (400)", async () => {
    const req = makeRequest("invalid-not-json-string");
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.code).toBe("INVALID_JSON");
  });

  it("rejects missing or invalid temperature payload (400)", async () => {
    const reqMissingTemp = makeRequest({ deviceId: "thermoguard-01" });
    const resMissingTemp = await POST(reqMissingTemp);
    const jsonMissingTemp = await resMissingTemp.json();

    expect(resMissingTemp.status).toBe(400);
    expect(jsonMissingTemp.error.code).toBe("INVALID_TEMPERATURE");

    const reqOutOfRange = makeRequest({ deviceId: "thermoguard-01", temperatureC: 999 });
    const resOutOfRange = await POST(reqOutOfRange);
    const jsonOutOfRange = await resOutOfRange.json();

    expect(resOutOfRange.status).toBe(400);
    expect(jsonOutOfRange.error.code).toBe("TEMPERATURE_OUT_OF_RANGE");
  });

  it("successfully persists valid reading and returns 201 Created", async () => {
    const mockStoredReading = {
      id: "mock-doc-id-12345",
      deviceId: "thermoguard-01",
      temperatureC: 26.8,
      receivedAt: "2026-10-28T22:30:00.000Z",
    };

    vi.mocked(recordTemperatureReading).mockResolvedValue(mockStoredReading);

    const req = makeRequest({
      deviceId: "thermoguard-01",
      temperatureC: 26.8,
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.data.id).toBe("mock-doc-id-12345");
    expect(json.data.deviceId).toBe("thermoguard-01");
    expect(json.data.temperatureC).toBe(26.8);
    expect(json.data.receivedAt).toBe("2026-10-28T22:30:00.000Z");
    expect(res.headers.get("Cache-Control")).toContain("no-store");
  });

  it("returns 503 DATABASE_UNAVAILABLE when database persistence throws an error", async () => {
    vi.mocked(recordTemperatureReading).mockRejectedValue(new Error("MongoTimeoutError"));

    const req = makeRequest({
      deviceId: "thermoguard-01",
      temperatureC: 25.0,
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(503);
    expect(json.error.code).toBe("DATABASE_UNAVAILABLE");
    expect(json.error.retryable).toBe(true);
  });

  it("enforces rate limits and returns 429 when threshold exceeded", async () => {
    vi.mocked(recordTemperatureReading).mockResolvedValue({
      id: "id",
      deviceId: "busy-device",
      temperatureC: 20,
      receivedAt: new Date().toISOString(),
    });

    // Make 30 valid requests (limit is 30)
    for (let i = 0; i < 30; i++) {
      const req = makeRequest({ deviceId: "busy-device", temperatureC: 20 });
      const res = await POST(req);
      expect(res.status).toBe(201);
    }

    // 31st request should be rate-limited
    const req31 = makeRequest({ deviceId: "busy-device", temperatureC: 20 });
    const res31 = await POST(req31);
    const json31 = await res31.json();

    expect(res31.status).toBe(429);
    expect(json31.error.code).toBe("RATE_LIMITED");
    expect(json31.error.retryable).toBe(true);
    expect(res31.headers.get("Retry-After")).toBeDefined();
  });
});
