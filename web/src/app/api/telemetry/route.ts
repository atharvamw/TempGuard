import { NextRequest, NextResponse } from "next/server";
import { verifyDeviceAuth } from "@/lib/device-auth";
import { validateTelemetryPayload } from "@/lib/validation";
import { recordTemperatureReading } from "@/lib/telemetry";
import { ingestionRateLimiter } from "@/lib/rate-limit";
import { createErrorResponse } from "@/lib/errors";
import { ApiSuccessResponse } from "@/types/api";
import { SerializedTemperatureReading } from "@/types/telemetry";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest
): Promise<NextResponse> {
  // 1. Device Authentication
  const authHeader = request.headers.get("authorization") || request.headers.get("x-device-token");
  if (!verifyDeviceAuth(authHeader)) {
    return createErrorResponse(
      "UNAUTHORIZED",
      "Invalid or missing device authentication token.",
      401,
      false
    );
  }

  // 2. Parse JSON body safely
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return createErrorResponse(
      "INVALID_JSON",
      "Request body could not be parsed as valid JSON.",
      400,
      false
    );
  }

  // 3. Validate Telemetry Payload
  const validation = validateTelemetryPayload(body);
  if (!validation.success || !validation.data) {
    return createErrorResponse(
      validation.error?.code || "VALIDATION_ERROR",
      validation.error?.message || "Invalid telemetry payload.",
      400,
      false
    );
  }

  const { deviceId, temperatureC, measuredAt } = validation.data;

  // 4. Rate Limiting Check (per device)
  const rateLimit = ingestionRateLimiter.check(deviceId);
  if (!rateLimit.allowed) {
    const res = createErrorResponse(
      "RATE_LIMITED",
      "Too many telemetry requests. Please throttle your transmission.",
      429,
      true
    );
    res.headers.set("Retry-After", Math.ceil(rateLimit.resetMs / 1000).toString());
    return res;
  }

  // 5. Persist to MongoDB
  try {
    const reading = await recordTemperatureReading(deviceId, temperatureC, measuredAt);

    const responsePayload: ApiSuccessResponse<SerializedTemperatureReading> = {
      data: reading,
    };

    return NextResponse.json(responsePayload, {
      status: 201,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    const safeMsg = error instanceof Error ? error.message : "Unknown persistence error";
    console.error("Telemetry ingestion persistence error:", safeMsg);

    return createErrorResponse(
      "DATABASE_UNAVAILABLE",
      "Temperature data could not be saved due to a database failure.",
      503,
      true
    );
  }
}
