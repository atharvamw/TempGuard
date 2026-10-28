import { MongoClient } from "mongodb";
import path from "path";
import { fileURLToPath } from "url";
import dns from "node:dns";

// Configure reliable DNS servers for SRV resolution
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {
  // ignore
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.loadEnvFile(path.resolve(__dirname, "../.env.local"));

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || "thermoguard";

console.log("Connecting to MongoDB Atlas...");
console.log("Database target:", dbName);

if (!uri) {
  console.error("Error: MONGODB_URI is not set!");
  process.exit(1);
}

const client = new MongoClient(uri, {
  serverSelectionTimeoutMS: 8000,
});

async function main() {
  try {
    await client.connect();
    console.log("Connected successfully to MongoDB Atlas!");

    const db = client.db(dbName);

    // 1. Ping
    const pingRes = await db.command({ ping: 1 });
    console.log("Ping response:", pingRes);

    // 2. Ensure indexes
    const readingsCol = db.collection("temperature_readings");
    const settingsCol = db.collection("device_settings");

    console.log("Creating/verifying indexes...");
    const idx1 = await readingsCol.createIndex(
      { deviceId: 1, receivedAt: -1 },
      { name: "deviceId_receivedAt_desc" }
    );
    console.log("Created compound index:", idx1);

    const idx2 = await readingsCol.createIndex(
      { receivedAt: 1 },
      {
        name: "receivedAt_ttl_7d",
        expireAfterSeconds: 7 * 24 * 60 * 60,
      }
    );
    console.log("Created 7-day TTL index:", idx2);

    const idx3 = await settingsCol.createIndex(
      { deviceId: 1 },
      { name: "deviceId_unique", unique: true }
    );
    console.log("Created unique settings index:", idx3);

    // 3. Test insert & read
    const testDoc = {
      deviceId: "test-device",
      temperatureC: 23.5,
      receivedAt: new Date(),
    };
    const insertRes = await readingsCol.insertOne(testDoc);
    console.log("Inserted test reading with ID:", insertRes.insertedId.toString());

    const retrieved = await readingsCol.findOne({ _id: insertRes.insertedId });
    console.log("Queried test reading:", retrieved.deviceId, retrieved.temperatureC, retrieved.receivedAt);

    // Clean up test doc
    await readingsCol.deleteOne({ _id: insertRes.insertedId });
    console.log("Cleaned up test document.");

    console.log("\nALL MONGODB ATLAS CHECKS PASSED!");
  } catch (err) {
    console.error("MongoDB Atlas connection error:", err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
