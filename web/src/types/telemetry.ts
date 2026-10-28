import { ObjectId } from "mongodb";

/**
 * Raw BSON document stored in MongoDB `temperature_readings` collection.
 */
export interface TemperatureReadingDocument {
  _id?: ObjectId;
  deviceId: string;
  temperatureC: number;
  receivedAt: Date;
  measuredAt?: Date;
}

/**
 * Clean serialized temperature reading transferred via JSON API.
 */
export interface SerializedTemperatureReading {
  id?: string;
  deviceId: string;
  temperatureC: number;
  receivedAt: string; // ISO 8601 UTC
  measuredAt?: string; // ISO 8601 UTC
}

/**
 * Configurable thresholds and preferences stored in MongoDB `device_settings` collection.
 */
export interface DeviceSettingsDocument {
  _id?: ObjectId;
  deviceId: string;
  minTemperatureC: number;
  maxTemperatureC: number;
  updatedAt: Date;
}

/**
 * Payload expected on POST /api/telemetry
 */
export interface IngestionPayload {
  deviceId: string;
  temperatureC: number;
  measuredAt?: string;
}

/**
 * Device connectivity and freshness status.
 */
export type DeviceFreshnessStatus =
  | "live"
  | "delayed"
  | "stale"
  | "awaiting_first_reading"
  | "service_unavailable";

/**
 * Range option for historical queries.
 */
export type HistoryRange = "1h" | "24h" | "7d";

/**
 * Calculated temperature statistics for a given historical range.
 */
export interface TemperatureStats {
  min: number | null;
  max: number | null;
  avg: number | null;
  count: number;
}
