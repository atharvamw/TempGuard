import { NextRequest, NextResponse } from "next/server";
import {
  getLatestReading,
  getDeviceSettings,
  calculateDeviceFreshness,
  checkThresholdViolation,
} from "@/lib/telemetry";
import { createErrorResponse } from "@/lib/errors";
import { ApiSuccessResponse } from "@/types/api";
import { LatestReadingData } from "@/types/telemetry";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const deviceId = searchParams.get("deviceId")?.trim() || process.env.DEVICE_ID || "thermoguard-01";

  try {
    // 1. Fetch latest stored reading and device threshold settings
    const [latestReading, settingsDoc] = await Promise.all([
      getLatestReading(deviceId),
      getDeviceSettings(deviceId),
    ]);

    const now = Date.now();
    let ageSeconds: number | null = null;

    if (latestReading?.receivedAt) {
      const receivedMs = new Date(latestReading.receivedAt).getTime();
      ageSeconds = Math.max(0, Math.floor((now - receivedMs) / 1000));
    }

    // 2. Compute freshness classification (live / delayed / stale / awaiting_first_reading)
    const freshnessStatus = calculateDeviceFreshness(latestReading?.receivedAt, now);

    // 3. Check threshold compliance
    const settings = settingsDoc
      ? {
          minTemperatureC: settingsDoc.minTemperatureC,
          maxTemperatureC: settingsDoc.maxTemperatureC,
        }
      : null;

    const thresholdViolation = checkThresholdViolation(latestReading?.temperatureC, settings);

    const payload: ApiSuccessResponse<LatestReadingData> = {
      data: {
        reading: latestReading,
        ageSeconds,
        freshnessStatus,
        settings,
        thresholdViolation,
      },
    };

    return NextResponse.json(payload, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching latest telemetry reading:", message);

    return createErrorResponse(
      "DATABASE_UNAVAILABLE",
      "Unable to fetch the latest temperature reading.",
      503,
      true
    );
  }
}
