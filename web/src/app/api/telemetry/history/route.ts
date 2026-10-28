import { NextRequest, NextResponse } from "next/server";
import { getHistoricalReadings, getHistoryCutoffDate } from "@/lib/telemetry";
import { createErrorResponse } from "@/lib/errors";
import { ApiSuccessResponse } from "@/types/api";
import { HistoryRange, HistoryResponseData } from "@/types/telemetry";

export const dynamic = "force-dynamic";

const VALID_RANGES: Record<string, HistoryRange> = {
  "1h": "1h",
  "24h": "24h",
  "7d": "7d",
};

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);

  const rawRange = searchParams.get("range") || "24h";
  const range = VALID_RANGES[rawRange];

  if (!range) {
    return createErrorResponse(
      "INVALID_RANGE",
      "Query parameter 'range' must be one of: 1h, 24h, 7d.",
      400,
      false
    );
  }

  const deviceId = searchParams.get("deviceId")?.trim() || process.env.DEVICE_ID || "thermoguard-01";
  if (!deviceId || deviceId.length > 64 || !/^[a-zA-Z0-9_-]+$/.test(deviceId)) {
    return createErrorResponse(
      "INVALID_DEVICE_ID",
      "Query parameter 'deviceId' contains invalid characters.",
      400,
      false
    );
  }

  try {
    const startTime = getHistoryCutoffDate(range).toISOString();
    const endTime = new Date().toISOString();

    const { readings, stats } = await getHistoricalReadings(deviceId, range);

    const payload: ApiSuccessResponse<HistoryResponseData> = {
      data: {
        deviceId,
        range,
        startTime,
        endTime,
        readings,
        stats,
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
    console.error("Error fetching historical telemetry:", message);

    return createErrorResponse(
      "DATABASE_UNAVAILABLE",
      "Unable to fetch historical temperature readings.",
      503,
      true
    );
  }
}
