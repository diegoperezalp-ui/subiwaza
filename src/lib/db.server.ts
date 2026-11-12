import "dotenv/config";
import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI;
const databaseName = process.env.MONGODB_DATABASE ?? "subiwaza";

if (!uri && process.env.NODE_ENV === "production") {
  throw new Error("MONGODB_URI must be configured before starting Subiwaza.");
}

declare global {
  // Reuse one pool across hot reloads and requests in the Node server.
  var __subiwazaMongoClient: MongoClient | undefined;
  var __subiwazaMongoPromise: Promise<MongoClient> | undefined;
}

export async function getDb(): Promise<Db> {
  if (!uri) throw new Error("Falta configurar MONGODB_URI en el archivo .env.");
  const client =
    globalThis.__subiwazaMongoClient ??
    new MongoClient(uri, {
      maxPoolSize: 12,
      serverSelectionTimeoutMS: 8_000,
      appName: "Subiwaza",
    });
  globalThis.__subiwazaMongoClient = client;
  globalThis.__subiwazaMongoPromise ??= client.connect();
  await globalThis.__subiwazaMongoPromise;

  const db = client.db(databaseName);
  await ensureIndexes(db);
  return db;
}

export function isMongoConfigured() {
  return Boolean(uri);
}

export async function getMongoClient() {
  await getDb();
  return globalThis.__subiwazaMongoClient!;
}

const indexesReady = new WeakMap<Db, Promise<void>>();

function ensureIndexes(db: Db): Promise<void> {
  let ready = indexesReady.get(db);
  if (!ready) {
    ready = Promise.all([
      db.collection("users").createIndex({ email: 1 }, { unique: true }),
      db.collection("sessions").createIndex({ tokenHash: 1 }, { unique: true }),
      db.collection("sessions").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      db.collection("jobs").createIndex({ status: 1, category: 1, createdAt: -1 }),
      db.collection("jobs").createIndex({ clientId: 1, createdAt: -1 }),
      db.collection("reviews").createIndex({ jobId: 1, authorId: 1 }, { unique: true }),
    ]).then(() => undefined);
    indexesReady.set(db, ready);
  }
  return ready;
}
