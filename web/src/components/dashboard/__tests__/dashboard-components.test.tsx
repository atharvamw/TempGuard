import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { StatusBadge } from "../StatusBadge";
import { TemperatureOverview } from "../TemperatureOverview";
import { TemperatureStats } from "../TemperatureStats";

describe("StatusBadge", () => {
  it("renders live status with green indicator and pulse", () => {
    const html = renderToString(<StatusBadge status="live" />);
    expect(html).toContain("Live");
    expect(html).toContain("animate-pulse");
    expect(html).toContain("bg-emerald");
  });

  it("renders delayed status with amber badge", () => {
    const html = renderToString(<StatusBadge status="delayed" />);
    expect(html).toContain("Delayed");
    expect(html).toContain("bg-amber");
  });

  it("renders stale status with offline badge", () => {
    const html = renderToString(<StatusBadge status="stale" />);
    expect(html).toContain("Device Offline");
    expect(html).toContain("bg-orange");
  });

  it("renders awaiting_first_reading status", () => {
    const html = renderToString(<StatusBadge status="awaiting_first_reading" />);
    expect(html).toContain("Awaiting First Reading");
    expect(html).toContain("bg-blue");
  });

  it("renders service_unavailable status", () => {
    const html = renderToString(<StatusBadge status="service_unavailable" />);
    expect(html).toContain("Service Unavailable");
    expect(html).toContain("bg-rose");
  });
});

describe("TemperatureOverview", () => {
  it("renders first-run waiting state when reading is null", () => {
    const html = renderToString(
      <TemperatureOverview
        data={{
          reading: null,
          ageSeconds: null,
          freshnessStatus: "awaiting_first_reading",
        }}
        isRefreshing={false}
        onRefresh={() => {}}
      />
    );
    expect(html).toContain("Waiting for your first reading");
    expect(html).toContain("Connect your ESP32 sensor");
  });

  it("renders temperature reading and timestamps when reading exists", () => {
    const html = renderToString(
      <TemperatureOverview
        data={{
          reading: {
            id: "1",
            deviceId: "thermoguard-01",
            temperatureC: 25.4,
            receivedAt: new Date().toISOString(),
          },
          ageSeconds: 15,
          freshnessStatus: "live",
          settings: { minTemperatureC: 18, maxTemperatureC: 28 },
          thresholdViolation: null,
        }}
        isRefreshing={false}
        onRefresh={() => {}}
      />
    );
    expect(html).toContain("25.4");
    expect(html).toContain("thermoguard-01");
    expect(html).toContain("15s ago");
  });

  it("displays stale warning alert when status is stale", () => {
    const html = renderToString(
      <TemperatureOverview
        data={{
          reading: {
            id: "1",
            deviceId: "thermoguard-01",
            temperatureC: 22.0,
            receivedAt: new Date().toISOString(),
          },
          ageSeconds: 7200,
          freshnessStatus: "stale",
          settings: { minTemperatureC: 18, maxTemperatureC: 28 },
          thresholdViolation: null,
        }}
        isRefreshing={false}
        onRefresh={() => {}}
      />
    );
    expect(html).toContain("Device is offline.");
    expect(html).toContain("2 hours ago");
    expect(html).toContain("Displaying the last stored measurement, not a live reading.");
  });

  it("displays threshold alert when temperature exceeds maximum", () => {
    const html = renderToString(
      <TemperatureOverview
        data={{
          reading: {
            id: "1",
            deviceId: "thermoguard-01",
            temperatureC: 31.5,
            receivedAt: new Date().toISOString(),
          },
          ageSeconds: 20,
          freshnessStatus: "live",
          settings: { minTemperatureC: 18, maxTemperatureC: 28 },
          thresholdViolation: "high",
        }}
        isRefreshing={false}
        onRefresh={() => {}}
      />
    );
    expect(html).toContain("Temperature threshold exceeded:");
    expect(html).toContain("above the configured maximum threshold");
    expect(html).toContain("28.0");
  });
});

describe("TemperatureStats", () => {
  it("renders min, max, avg and sample count correctly", () => {
    const html = renderToString(
      <TemperatureStats
        stats={{ min: 21.3, max: 29.8, avg: 25.1, count: 180 }}
        range="24h"
      />
    );
    expect(html).toContain("21.3°C");
    expect(html).toContain("29.8°C");
    expect(html).toContain("25.1°C");
    expect(html).toContain("180");
  });

  it("renders fallback placeholders when stats are null", () => {
    const html = renderToString(
      <TemperatureStats
        stats={null}
        range="1h"
      />
    );
    expect(html).toContain("--");
    expect(html).toContain("0");
  });
});
