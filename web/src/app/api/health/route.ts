import { NextResponse } from "next/server";
import { getDatabase, ensureMongoIndices } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const shouldInitIndices = url.searchParams.get("initIndices") === "true";

  let databaseStatus = "disconnected";
  let indicesResult = undefined;

  try {
    const db = await getDatabase();
    // Lightweight ping command to verify database availability
    const pingResult = await db.command({ ping: 1 });
    if (pingResult && pingResult.ok === 1) {
      databaseStatus = "connected";
    }

    if (shouldInitIndices && databaseStatus === "connected") {
      indicesResult = await ensureMongoIndices();
    }
  } catch (err) {
    // Log safe error internally without exposing credentials to caller
    const errMsg = err instanceof Error ? err.message : "Unknown database connection issue";
    console.error("Health check database error:", errMsg);
    databaseStatus = "unavailable";
  }

  const isHealthy = databaseStatus === "connected";
  const statusCode = isHealthy ? 200 : 503;

  return NextResponse.json(
    {
      data: {
        status: isHealthy ? "healthy" : "degraded",
        timestamp: new Date().toISOString(),
        services: {
          api: "up",
          database: databaseStatus,
        },
        ...(indicesResult ? { indices: indicesResult } : {}),
      },
    },
    {
      status: statusCode,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
