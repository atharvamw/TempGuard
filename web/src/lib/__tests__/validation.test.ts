import { describe, it, expect } from "vitest";
import {
  validateTelemetryPayload,
  validateThresholdSettings,
  MIN_PLAUSIBLE_TEMP_C,
  MAX_PLAUSIBLE_TEMP_C,
} from "../validation";

describe("validateTelemetryPayload", () => {
  it("accepts a valid telemetry payload", () => {
    const payload = {
      deviceId: "thermoguard-01",
      temperatureC: 24.5,
    };
    const result = validateTelemetryPayload(payload);
    expect(result.success).toBe(true);
    expect(result.data?.deviceId).toBe("thermoguard-01");
    expect(result.data?.temperatureC).toBe(24.5);
    expect(result.data?.measuredAt).toBeUndefined();
  });

  it("accepts a valid payload with measuredAt ISO string", () => {
    const now = new Date().toISOString();
    const payload = {
      deviceId: "thermoguard-01",
      temperatureC: 22.0,
      measuredAt: now,
    };
    const result = validateTelemetryPayload(payload);
    expect(result.success).toBe(true);
    expect(result.data?.measuredAt).toBe(now);
  });

  it("rejects non-object body", () => {
    expect(validateTelemetryPayload(null).success).toBe(false);
    expect(validateTelemetryPayload("string").success).toBe(false);
    expect(validateTelemetryPayload([]).success).toBe(false);
  });

  it("rejects missing or empty deviceId", () => {
    expect(validateTelemetryPayload({ temperatureC: 25 }).success).toBe(false);
    expect(validateTelemetryPayload({ deviceId: "", temperatureC: 25 }).success).toBe(false);
    expect(validateTelemetryPayload({ deviceId: "   ", temperatureC: 25 }).success).toBe(false);
  });

  it("rejects deviceId with invalid characters or too long", () => {
    expect(
      validateTelemetryPayload({ deviceId: "device<script>", temperatureC: 25 }).success
    ).toBe(false);
    expect(
      validateTelemetryPayload({ deviceId: "a".repeat(100), temperatureC: 25 }).success
    ).toBe(false);
  });

  it("rejects missing, NaN, or non-numeric temperature", () => {
    expect(validateTelemetryPayload({ deviceId: "dev-1" }).success).toBe(false);
    expect(validateTelemetryPayload({ deviceId: "dev-1", temperatureC: "25" }).success).toBe(false);
    expect(validateTelemetryPayload({ deviceId: "dev-1", temperatureC: NaN }).success).toBe(false);
    expect(validateTelemetryPayload({ deviceId: "dev-1", temperatureC: Infinity }).success).toBe(false);
  });

  it("rejects temperatures outside plausible physical range", () => {
    expect(
      validateTelemetryPayload({ deviceId: "dev-1", temperatureC: MIN_PLAUSIBLE_TEMP_C - 10 }).success
    ).toBe(false);
    expect(
      validateTelemetryPayload({ deviceId: "dev-1", temperatureC: MAX_PLAUSIBLE_TEMP_C + 10 }).success
    ).toBe(false);
  });

  it("rejects future measuredAt timestamps", () => {
    const futureDate = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour in future
    const result = validateTelemetryPayload({
      deviceId: "dev-1",
      temperatureC: 20,
      measuredAt: futureDate,
    });
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe("INVALID_MEASURED_AT");
  });
});

describe("validateThresholdSettings", () => {
  it("accepts valid threshold settings", () => {
    const result = validateThresholdSettings({
      minTemperatureC: 18,
      maxTemperatureC: 28,
    });
    expect(result.success).toBe(true);
    expect(result.data?.minTemperatureC).toBe(18);
    expect(result.data?.maxTemperatureC).toBe(28);
  });

  it("rejects when minTemperature is greater than or equal to maxTemperature", () => {
    const resultEqual = validateThresholdSettings({
      minTemperatureC: 25,
      maxTemperatureC: 25,
    });
    expect(resultEqual.success).toBe(false);
    expect(resultEqual.error?.code).toBe("INVALID_THRESHOLD_RANGE");

    const resultGreater = validateThresholdSettings({
      minTemperatureC: 30,
      maxTemperatureC: 20,
    });
    expect(resultGreater.success).toBe(false);
  });

  it("rejects non-numeric thresholds", () => {
    expect(
      validateThresholdSettings({ minTemperatureC: "10", maxTemperatureC: 25 }).success
    ).toBe(false);
    expect(
      validateThresholdSettings({ minTemperatureC: 10, maxTemperatureC: NaN }).success
    ).toBe(false);
  });
});
