import { getReadingsCollection, getSettingsCollection } from "@/lib/mongodb";
import {
  TemperatureReadingDocument,
  SerializedTemperatureReading,
  DeviceSettingsDocument,
  HistoryRange,
  TemperatureStats,
  DeviceFreshnessStatus,
} from "@/types/telemetry";

/**
 * Inserts an accepted temperature reading into MongoDB.
 */
export async function recordTemperatureReading(
  deviceId: string,
  temperatureC: number,
  measuredAt?: string
): Promise<SerializedTemperatureReading> {
  const collection = await getReadingsCollection();

  const receivedAtDate = new Date();
  const measuredAtDate = measuredAt ? new Date(measuredAt) : undefined;

  const doc: TemperatureReadingDocument = {
    deviceId,
    temperatureC,
    receivedAt: receivedAtDate,
    ...(measuredAtDate ? { measuredAt: measuredAtDate } : {}),
  };

  const insertResult = await collection.insertOne(doc);

  return {
    id: insertResult.insertedId.toString(),
    deviceId,
    temperatureC,
    receivedAt: receivedAtDate.toISOString(),
    ...(measuredAtDate ? { measuredAt: measuredAtDate.toISOString() } : {}),
  };
}

/**
 * Retrieves the latest temperature reading for a given device.
 */
export async function getLatestReading(
  deviceId: string
): Promise<SerializedTemperatureReading | null> {
  const collection = await getReadingsCollection();

  const doc = await collection.findOne(
    { deviceId },
    { sort: { receivedAt: -1 } }
  );

  if (!doc) {
    return null;
  }

  return {
    id: doc._id?.toString(),
    deviceId: doc.deviceId,
    temperatureC: doc.temperatureC,
    receivedAt: doc.receivedAt.toISOString(),
    measuredAt: doc.measuredAt ? doc.measuredAt.toISOString() : undefined,
  };
}

/**
 * Calculates start Date based on selected history range.
 */
export function getHistoryCutoffDate(range: HistoryRange): Date {
  const now = Date.now();
  let msAgo = 24 * 60 * 60 * 1000; // default 24h

  if (range === "1h") {
    msAgo = 1 * 60 * 60 * 1000;
  } else if (range === "24h") {
    msAgo = 24 * 60 * 60 * 1000;
  } else if (range === "7d") {
    msAgo = 7 * 24 * 60 * 60 * 1000;
  }

  return new Date(now - msAgo);
}

/**
 * Downsamples time-series readings to a target number of points if readings exceed target count.
 * Preserves true timestamps and calculates bucketed average temperatures.
 */
export function downsampleReadings(
  readings: SerializedTemperatureReading[],
  targetPoints: number = 300
): SerializedTemperatureReading[] {
  if (readings.length <= targetPoints) {
    return readings;
  }

  const sampled: SerializedTemperatureReading[] = [];
  const bucketSize = readings.length / targetPoints;

  for (let i = 0; i < targetPoints; i++) {
    const startIndex = Math.floor(i * bucketSize);
    const endIndex = Math.min(Math.floor((i + 1) * bucketSize), readings.length);

    if (startIndex >= readings.length) break;

    const bucket = readings.slice(startIndex, endIndex);
    if (bucket.length === 0) continue;

    let sumTemp = 0;
    for (const item of bucket) {
      sumTemp += item.temperatureC;
    }
    const avgTemp = Math.round((sumTemp / bucket.length) * 100) / 100;
    const midItem = bucket[Math.floor(bucket.length / 2)];

    sampled.push({
      id: midItem.id,
      deviceId: midItem.deviceId,
      temperatureC: avgTemp,
      receivedAt: midItem.receivedAt,
      measuredAt: midItem.measuredAt,
    });
  }

  return sampled;
}

/**
 * Checks if a temperature reading violates the configured thresholds.
 */
export function checkThresholdViolation(
  temperatureC: number | null | undefined,
  settings: { minTemperatureC: number; maxTemperatureC: number } | null | undefined
): "low" | "high" | null {
  if (temperatureC === null || temperatureC === undefined || !settings) {
    return null;
  }

  if (temperatureC < settings.minTemperatureC) {
    return "low";
  }

  if (temperatureC > settings.maxTemperatureC) {
    return "high";
  }

  return null;
}

/**
 * Retrieves chronologically sorted readings for a given time range.
 */
export async function getHistoricalReadings(
  deviceId: string,
  range: HistoryRange,
  maxPoints: number = 300
): Promise<{ readings: SerializedTemperatureReading[]; stats: TemperatureStats }> {
  const collection = await getReadingsCollection();
  const cutoff = getHistoryCutoffDate(range);

  const cursor = collection
    .find(
      {
        deviceId,
        receivedAt: { $gte: cutoff },
      },
      { sort: { receivedAt: 1 } }
    )
    .limit(10000); // Bounded query to safeguard serverless memory

  const docs = await cursor.toArray();

  const rawReadings: SerializedTemperatureReading[] = docs.map((doc) => ({
    id: doc._id?.toString(),
    deviceId: doc.deviceId,
    temperatureC: doc.temperatureC,
    receivedAt: doc.receivedAt.toISOString(),
    measuredAt: doc.measuredAt ? doc.measuredAt.toISOString() : undefined,
  }));

  // Calculate statistics over the complete raw dataset
  const stats = computeTemperatureStats(rawReadings);

  // Downsample if raw count exceeds target resolution for charts
  const downsampled = downsampleReadings(rawReadings, maxPoints);

  return {
    readings: downsampled,
    stats,
  };
}

/**
 * Computes min, max, avg, and count statistics for a set of readings.
 */
export function computeTemperatureStats(
  readings: { temperatureC: number }[]
): TemperatureStats {
  if (readings.length === 0) {
    return { min: null, max: null, avg: null, count: 0 };
  }

  let min = readings[0].temperatureC;
  let max = readings[0].temperatureC;
  let sum = 0;

  for (const r of readings) {
    if (r.temperatureC < min) min = r.temperatureC;
    if (r.temperatureC > max) max = r.temperatureC;
    sum += r.temperatureC;
  }

  const avg = Math.round((sum / readings.length) * 100) / 100;

  return {
    min: Math.round(min * 100) / 100,
    max: Math.round(max * 100) / 100,
    avg,
    count: readings.length,
  };
}

/**
 * Evaluates device connectivity freshness based on PRD rules:
 * - Live: received within last 60 seconds
 * - Delayed: older than 60s, up to 1 hour
 * - Stale: older than 1 hour
 * - Awaiting: no reading ever received
 */
export function calculateDeviceFreshness(
  lastReceivedAt: string | Date | null | undefined,
  nowMs: number = Date.now()
): DeviceFreshnessStatus {
  if (!lastReceivedAt) {
    return "awaiting_first_reading";
  }

  const receivedMs =
    typeof lastReceivedAt === "string"
      ? new Date(lastReceivedAt).getTime()
      : lastReceivedAt.getTime();

  if (Number.isNaN(receivedMs)) {
    return "awaiting_first_reading";
  }

  const ageMs = nowMs - receivedMs;

  if (ageMs < 0) {
    // If clock skew slightly in future, still treat as live
    return "live";
  }

  if (ageMs <= 60 * 1000) {
    return "live";
  }

  if (ageMs <= 60 * 60 * 1000) {
    return "delayed";
  }

  return "stale";
}

/**
 * Retrieves device settings (thresholds).
 */
export async function getDeviceSettings(
  deviceId: string
): Promise<DeviceSettingsDocument | null> {
  const collection = await getSettingsCollection();
  return collection.findOne({ deviceId });
}

/**
 * Persists device threshold settings.
 */
export async function updateDeviceSettings(
  deviceId: string,
  minTemperatureC: number,
  maxTemperatureC: number
): Promise<DeviceSettingsDocument> {
  const collection = await getSettingsCollection();
  const updatedAt = new Date();

  await collection.updateOne(
    { deviceId },
    {
      $set: {
        minTemperatureC,
        maxTemperatureC,
        updatedAt,
      },
    },
    { upsert: true }
  );

  return {
    deviceId,
    minTemperatureC,
    maxTemperatureC,
    updatedAt,
  };
}
