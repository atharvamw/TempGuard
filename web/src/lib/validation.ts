import { IngestionPayload } from "@/types/telemetry";

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export const MIN_PLAUSIBLE_TEMP_C = -55;
export const MAX_PLAUSIBLE_TEMP_C = 125;
export const MAX_DEVICE_ID_LENGTH = 64;

/**
 * Validates an incoming telemetry payload from an IoT device.
 */
export function validateTelemetryPayload(body: unknown): ValidationResult<IngestionPayload> {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return {
      success: false,
      error: {
        code: "INVALID_BODY",
        message: "Request payload must be a valid JSON object.",
      },
    };
  }

  const payload = body as Record<string, unknown>;

  // 1. Validate deviceId
  if (typeof payload.deviceId !== "string") {
    return {
      success: false,
      error: {
        code: "INVALID_DEVICE_ID",
        message: "Field 'deviceId' must be a non-empty string.",
      },
    };
  }

  const deviceId = payload.deviceId.trim();
  if (deviceId.length === 0 || deviceId.length > MAX_DEVICE_ID_LENGTH) {
    return {
      success: false,
      error: {
        code: "INVALID_DEVICE_ID",
        message: `Field 'deviceId' must be between 1 and ${MAX_DEVICE_ID_LENGTH} characters.`,
      },
    };
  }

  // Check allowed characters: letters, numbers, hyphens, underscores
  if (!/^[a-zA-Z0-9_-]+$/.test(deviceId)) {
    return {
      success: false,
      error: {
        code: "INVALID_DEVICE_ID",
        message: "Field 'deviceId' contains invalid characters. Use alphanumeric, hyphens, or underscores.",
      },
    };
  }

  // 2. Validate temperatureC
  if (
    typeof payload.temperatureC !== "number" ||
    Number.isNaN(payload.temperatureC) ||
    !Number.isFinite(payload.temperatureC)
  ) {
    return {
      success: false,
      error: {
        code: "INVALID_TEMPERATURE",
        message: "Field 'temperatureC' must be a finite numeric value.",
      },
    };
  }

  const temp = Math.round(payload.temperatureC * 100) / 100;
  if (temp < MIN_PLAUSIBLE_TEMP_C || temp > MAX_PLAUSIBLE_TEMP_C) {
    return {
      success: false,
      error: {
        code: "TEMPERATURE_OUT_OF_RANGE",
        message: `Field 'temperatureC' (${temp}) is outside the plausible physical range [${MIN_PLAUSIBLE_TEMP_C}°C, ${MAX_PLAUSIBLE_TEMP_C}°C].`,
      },
    };
  }

  // 3. Validate optional measuredAt
  let validatedMeasuredAt: string | undefined = undefined;
  if (payload.measuredAt !== undefined && payload.measuredAt !== null) {
    if (typeof payload.measuredAt !== "string") {
      return {
        success: false,
        error: {
          code: "INVALID_MEASURED_AT",
          message: "Field 'measuredAt' must be a valid ISO 8601 date string.",
        },
      };
    }

    const measuredDate = new Date(payload.measuredAt);
    if (Number.isNaN(measuredDate.getTime())) {
      return {
        success: false,
        error: {
          code: "INVALID_MEASURED_AT",
          message: "Field 'measuredAt' cannot be parsed as a valid timestamp.",
        },
      };
    }

    const now = Date.now();
    // Reject if measured timestamp is more than 10 minutes in the future
    if (measuredDate.getTime() > now + 10 * 60 * 1000) {
      return {
        success: false,
        error: {
          code: "INVALID_MEASURED_AT",
          message: "Field 'measuredAt' cannot be in the future.",
        },
      };
    }

    validatedMeasuredAt = measuredDate.toISOString();
  }

  return {
    success: true,
    data: {
      deviceId,
      temperatureC: temp,
      measuredAt: validatedMeasuredAt,
    },
  };
}

/**
 * Validates device threshold settings.
 */
export function validateThresholdSettings(body: unknown): ValidationResult<{
  minTemperatureC: number;
  maxTemperatureC: number;
}> {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return {
      success: false,
      error: {
        code: "INVALID_BODY",
        message: "Request payload must be a valid JSON object.",
      },
    };
  }

  const payload = body as Record<string, unknown>;

  if (
    typeof payload.minTemperatureC !== "number" ||
    Number.isNaN(payload.minTemperatureC) ||
    !Number.isFinite(payload.minTemperatureC)
  ) {
    return {
      success: false,
      error: {
        code: "INVALID_MIN_TEMPERATURE",
        message: "Field 'minTemperatureC' must be a finite number.",
      },
    };
  }

  if (
    typeof payload.maxTemperatureC !== "number" ||
    Number.isNaN(payload.maxTemperatureC) ||
    !Number.isFinite(payload.maxTemperatureC)
  ) {
    return {
      success: false,
      error: {
        code: "INVALID_MAX_TEMPERATURE",
        message: "Field 'maxTemperatureC' must be a finite number.",
      },
    };
  }

  if (payload.minTemperatureC >= payload.maxTemperatureC) {
    return {
      success: false,
      error: {
        code: "INVALID_THRESHOLD_RANGE",
        message: "Minimum threshold must be strictly less than maximum threshold.",
      },
    };
  }

  return {
    success: true,
    data: {
      minTemperatureC: payload.minTemperatureC,
      maxTemperatureC: payload.maxTemperatureC,
    },
  };
}
