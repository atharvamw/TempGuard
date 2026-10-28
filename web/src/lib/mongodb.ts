import { MongoClient, Db, Collection } from "mongodb";
import { TemperatureReadingDocument, DeviceSettingsDocument } from "@/types/telemetry";
import dns from "node:dns";

// Ensure reliable SRV DNS resolution across all networks and platforms
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {
  // Ignore in environments where setting DNS servers is restricted
}

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/thermoguard";
const dbName = process.env.MONGODB_DB_NAME || "thermoguard";

// 7 days in seconds for automatic data retention
const RETENTION_TTL_SECONDS = 7 * 24 * 60 * 60; // 604,800 seconds

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (!process.env.MONGODB_URI && process.env.NODE_ENV === "production") {
  console.warn("MONGODB_URI is not set in environment variables.");
}

if (process.env.NODE_ENV === "development") {
  // In development, preserve MongoClient across HMR module reloads
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production / serverless, reuse client promise across warm invocations
  client = new MongoClient(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
  });
  clientPromise = client.connect();
}

/**
 * Returns the cached connected MongoClient.
 */
export async function getMongoClient(): Promise<MongoClient> {
  return clientPromise;
}

/**
 * Returns the target MongoDB database instance.
 */
export async function getDatabase(customDbName?: string): Promise<Db> {
  const connectedClient = await getMongoClient();
  return connectedClient.db(customDbName || dbName);
}

/**
 * Returns the temperature_readings collection.
 */
export async function getReadingsCollection(): Promise<Collection<TemperatureReadingDocument>> {
  const db = await getDatabase();
  return db.collection<TemperatureReadingDocument>("temperature_readings");
}

/**
 * Returns the device_settings collection.
 */
export async function getSettingsCollection(): Promise<Collection<DeviceSettingsDocument>> {
  const db = await getDatabase();
  return db.collection<DeviceSettingsDocument>("device_settings");
}

/**
 * Ensures optimal indexes exist on MongoDB collections.
 * - Compound index on temperature_readings: { deviceId: 1, receivedAt: -1 }
 * - TTL index on temperature_readings: { receivedAt: 1 } (expires in 7 days)
 * - Unique index on device_settings: { deviceId: 1 }
 */
export async function ensureMongoIndices(): Promise<{ success: boolean; message: string }> {
  try {
    const readingsCol = await getReadingsCollection();
    const settingsCol = await getSettingsCollection();

    // 1. Compound index for fast queries: latest reading & time range history
    await readingsCol.createIndex(
      { deviceId: 1, receivedAt: -1 },
      { name: "deviceId_receivedAt_desc" }
    );

    // 2. TTL index: automatically purge readings older than 7 days
    await readingsCol.createIndex(
      { receivedAt: 1 },
      {
        name: "receivedAt_ttl_7d",
        expireAfterSeconds: RETENTION_TTL_SECONDS,
      }
    );

    // 3. Unique index for device settings
    await settingsCol.createIndex(
      { deviceId: 1 },
      { name: "deviceId_unique", unique: true }
    );

    return { success: true, message: "Indices successfully verified/created." };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error during index setup";
    console.error("Index initialization error:", message);
    return { success: false, message };
  }
}
