import "dotenv/config";
import { MongoClient, MongoServerError, type Db, type Document } from "mongodb";

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

const collectionValidators: Record<string, Document> = {
  users: {
    $jsonSchema: {
      bsonType: "object",
      required: [
        "_id",
        "name",
        "email",
        "phone",
        "passwordHash",
        "roles",
        "zone",
        "bio",
        "years",
        "createdAt",
        "phoneVerified",
        "contactConsent",
        "emailVerified",
        "ratingSum",
        "ratingCount",
        "jobsDone",
      ],
      properties: {
        _id: { bsonType: "objectId" },
        name: { bsonType: "string", minLength: 1, maxLength: 100 },
        email: { bsonType: "string", minLength: 3, maxLength: 254 },
        phone: { bsonType: "string", minLength: 8, maxLength: 24 },
        passwordHash: { bsonType: "string" },
        roles: { bsonType: "array", minItems: 1, items: { enum: ["cliente", "profesional"] } },
        trade: { bsonType: "string", maxLength: 80 },
        zone: { bsonType: "string", minLength: 2, maxLength: 80 },
        bio: { bsonType: "string", maxLength: 1000 },
        years: { bsonType: ["int", "long", "double"], minimum: 0, maximum: 80 },
        createdAt: { bsonType: "date" },
        phoneVerified: { bsonType: "bool" },
        contactConsent: { bsonType: "bool" },
        emailVerified: { bsonType: "bool" },
        ratingSum: { bsonType: ["int", "long", "double"], minimum: 0 },
        ratingCount: { bsonType: ["int", "long", "double"], minimum: 0 },
        jobsDone: { bsonType: ["int", "long", "double"], minimum: 0 },
      },
    },
  },
  sessions: {
    $jsonSchema: {
      bsonType: "object",
      required: ["tokenHash", "userId", "createdAt", "expiresAt"],
      properties: {
        tokenHash: { bsonType: "string", minLength: 64, maxLength: 64 },
        userId: { bsonType: "objectId" },
        createdAt: { bsonType: "date" },
        expiresAt: { bsonType: "date" },
      },
    },
  },
  jobs: {
    $jsonSchema: {
      bsonType: "object",
      required: [
        "_id",
        "clientId",
        "title",
        "category",
        "description",
        "zone",
        "budget",
        "urgency",
        "createdAt",
        "clientName",
        "clientRating",
        "status",
        "offers",
      ],
      properties: {
        _id: { bsonType: "objectId" },
        clientId: { bsonType: "objectId" },
        title: { bsonType: "string", minLength: 6, maxLength: 90 },
        category: {
          enum: [
            "plomeria",
            "electricidad",
            "carpinteria",
            "pintura",
            "cerrajeria",
            "climatizacion",
            "jardineria",
            "albanileria",
          ],
        },
        description: { bsonType: "string", minLength: 20, maxLength: 1000 },
        zone: { bsonType: "string", minLength: 2, maxLength: 80 },
        budget: { bsonType: ["int", "long", "double"], minimum: 100, maximum: 2000000 },
        urgency: { enum: ["hoy", "semana", "flexible"] },
        createdAt: { bsonType: ["int", "long", "double"] },
        clientName: { bsonType: "string", minLength: 1, maxLength: 100 },
        clientRating: { bsonType: ["int", "long", "double"], minimum: 0, maximum: 5 },
        status: { enum: ["abierto", "asignado", "completado"] },
        offers: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["id", "workerId", "price", "eta", "message", "status", "createdAt"],
            properties: {
              id: { bsonType: "string" },
              workerId: { bsonType: "string" },
              price: { bsonType: ["int", "long", "double"], minimum: 100, maximum: 2000000 },
              eta: { bsonType: "string", maxLength: 120 },
              message: { bsonType: "string", maxLength: 500 },
              status: { enum: ["pendiente", "aceptada", "rechazada"] },
              createdAt: { bsonType: ["int", "long", "double"] },
            },
          },
        },
        assignedWorkerId: { bsonType: "string" },
        finalPrice: { bsonType: ["int", "long", "double"], minimum: 100, maximum: 2000000 },
        rating: { bsonType: ["int", "long", "double"], minimum: 1, maximum: 5 },
        completedAt: { bsonType: ["int", "long", "double"] },
      },
    },
  },
  reviews: {
    $jsonSchema: {
      bsonType: "object",
      required: ["jobId", "authorId", "targetId", "stars", "createdAt"],
      properties: {
        jobId: { bsonType: "objectId" },
        authorId: { bsonType: "string" },
        targetId: { bsonType: "string" },
        stars: { bsonType: ["int", "long", "double"], minimum: 1, maximum: 5 },
        createdAt: { bsonType: "date" },
      },
    },
  },
};

async function ensureCollectionSchema(db: Db, name: string, validator: Document) {
  try {
    await db.createCollection(name, {
      validator,
      validationLevel: "strict",
      validationAction: "error",
    });
  } catch (error) {
    if (!(error instanceof MongoServerError) || error.code !== 48) throw error;
    // Existing app collections already have their validators. Keeping this
    // migration limited to first creation lets the app run with readWrite
    // privileges instead of requiring the broader dbAdmin role for collMod.
  }
}

function ensureIndexes(db: Db): Promise<void> {
  let ready = indexesReady.get(db);
  if (!ready) {
    ready = Promise.all(
      Object.entries(collectionValidators).map(([name, validator]) =>
        ensureCollectionSchema(db, name, validator),
      ),
    )
      .then(() =>
        Promise.all([
          db.collection("users").createIndex({ email: 1 }, { unique: true }),
          db.collection("sessions").createIndex({ tokenHash: 1 }, { unique: true }),
          db.collection("sessions").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
          db.collection("sessions").createIndex({ userId: 1 }),
          db.collection("jobs").createIndex({ status: 1, category: 1, createdAt: -1 }),
          db.collection("jobs").createIndex({ clientId: 1, createdAt: -1 }),
          db.collection("jobs").createIndex({ assignedWorkerId: 1, createdAt: -1 }),
          db.collection("jobs").createIndex({ "offers.workerId": 1, status: 1 }),
          db.collection("reviews").createIndex({ jobId: 1, authorId: 1 }, { unique: true }),
          db.collection("reviews").createIndex({ targetId: 1, createdAt: -1 }),
        ]),
      )
      .then(() => undefined);
    indexesReady.set(db, ready);
  }
  return ready;
}
