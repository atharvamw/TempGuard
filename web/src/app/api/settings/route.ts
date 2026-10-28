import { NextRequest, NextResponse } from "next/server";
import { getDeviceSettings, updateDeviceSettings } from "@/lib/telemetry";
import { validateThresholdSettings } from "@/lib/validation";
import { createErrorResponse } from "@/lib/errors";
import { ApiSuccessResponse } from "@/types/api";

export const dynamic = "force-dynamic";

const DEFAULT_MIN_TEMP = 18;
const DEFAULT_MAX_TEMP = 28;

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const deviceId = searchParams.get("deviceId")?.trim() || process.env.DEVICE_ID || "thermoguard-01";

  try {
    const settings = await getDeviceSettings(deviceId);

    return NextResponse.json(
      {
        data: {
          deviceId,
          minTemperatureC: settings ? settings.minTemperatureC : DEFAULT_MIN_TEMP,
          maxTemperatureC: settings ? settings.maxTemperatureC : DEFAULT_MAX_TEMP,
          isDefault: !settings,
          updatedAt: settings ? settings.updatedAt.toISOString() : new Date().toISOString(),
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching device settings:", message);

    return createErrorResponse(
      "DATABASE_UNAVAILABLE",
      "Unable to fetch device settings.",
      503,
      true
    );
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const deviceId = searchParams.get("deviceId")?.trim() || process.env.DEVICE_ID || "thermoguard-01";

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

  const validation = validateThresholdSettings(body);
  if (!validation.success || !validation.data) {
    return createErrorResponse(
      validation.error?.code || "INVALID_SETTINGS",
      validation.error?.message || "Invalid threshold settings.",
      400,
      false
    );
  }

  const { minTemperatureC, maxTemperatureC } = validation.data;

  try {
    const updated = await updateDeviceSettings(deviceId, minTemperatureC, maxTemperatureC);

    return NextResponse.json(
      {
        data: {
          deviceId: updated.deviceId,
          minTemperatureC: updated.minTemperatureC,
          maxTemperatureC: updated.maxTemperatureC,
          updatedAt: updated.updatedAt.toISOString(),
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error updating device settings:", message);

    return createErrorResponse(
      "DATABASE_UNAVAILABLE",
      "Unable to update device settings in the database.",
      503,
      true
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return PUT(request);
}
