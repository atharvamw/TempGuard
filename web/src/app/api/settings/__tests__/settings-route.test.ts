import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, PUT } from "../route";

vi.mock("@/lib/telemetry", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/telemetry")>();
  return {
    ...actual,
    getDeviceSettings: vi.fn(),
    updateDeviceSettings: vi.fn(),
  };
});

import { getDeviceSettings, updateDeviceSettings } from "@/lib/telemetry";

describe("/api/settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/settings", () => {
    it("returns default thresholds when no device settings are saved yet", async () => {
      vi.mocked(getDeviceSettings).mockResolvedValue(null);

      const req = new NextRequest("http://localhost:3000/api/settings");
      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.minTemperatureC).toBe(18);
      expect(json.data.maxTemperatureC).toBe(38);
      expect(json.data.isDefault).toBe(true);
    });

    it("returns saved thresholds from database", async () => {
      vi.mocked(getDeviceSettings).mockResolvedValue({
        deviceId: "thermoguard-01",
        minTemperatureC: 15,
        maxTemperatureC: 30,
        updatedAt: new Date("2026-10-28T20:00:00Z"),
      });

      const req = new NextRequest("http://localhost:3000/api/settings");
      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.minTemperatureC).toBe(15);
      expect(json.data.maxTemperatureC).toBe(30);
      expect(json.data.isDefault).toBe(false);
    });
  });

  describe("PUT /api/settings", () => {
    it("rejects invalid JSON body (400)", async () => {
      const req = new NextRequest("http://localhost:3000/api/settings", {
        method: "PUT",
        body: "invalid-json",
      });
      const res = await PUT(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error.code).toBe("INVALID_JSON");
    });

    it("rejects invalid thresholds where min >= max (400)", async () => {
      const req = new NextRequest("http://localhost:3000/api/settings", {
        method: "PUT",
        body: JSON.stringify({ minTemperatureC: 30, maxTemperatureC: 20 }),
      });
      const res = await PUT(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error.code).toBe("INVALID_THRESHOLD_RANGE");
    });

    it("updates and returns new thresholds (200)", async () => {
      vi.mocked(updateDeviceSettings).mockResolvedValue({
        deviceId: "thermoguard-01",
        minTemperatureC: 16,
        maxTemperatureC: 26,
        updatedAt: new Date("2026-10-28T22:00:00Z"),
      });

      const req = new NextRequest("http://localhost:3000/api/settings", {
        method: "PUT",
        body: JSON.stringify({ minTemperatureC: 16, maxTemperatureC: 26 }),
      });
      const res = await PUT(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.minTemperatureC).toBe(16);
      expect(json.data.maxTemperatureC).toBe(26);
    });
  });
});
