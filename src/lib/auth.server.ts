import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { getRequestHeader, setResponseHeader } from "@tanstack/react-start/server";
import { ObjectId, type Collection } from "mongodb";
import { getDb } from "./db.server";

export type AccountRole = "cliente" | "profesional";

export interface UserDoc {
  _id: ObjectId;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  roles: AccountRole[];
  trade?: string;
  zone: string;
  bio: string;
  years: number;
  createdAt: Date;
  phoneVerified: boolean;
  contactConsent: boolean;
  emailVerified: boolean;
  ratingSum: number;
  ratingCount: number;
  jobsDone: number;
}

export type PublicUser = Omit<
  UserDoc,
  "_id" | "passwordHash" | "email" | "phone" | "contactConsent"
> & {
  id: string;
  email?: string;
  phone?: string;
};

interface SessionDoc {
  tokenHash: string;
  userId: ObjectId;
  createdAt: Date;
  expiresAt: Date;
}

function digest(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function cookieOptions(maxAge: number) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `subiwaza_session; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

function setSessionCookie(value: string, maxAge: number) {
  setResponseHeader(
    "Set-Cookie",
    `${cookieOptions(maxAge).replace("subiwaza_session", `subiwaza_session=${value}`)}`,
  );
}

export function publicUser(user: UserDoc, includePrivate = false): PublicUser {
  return {
    id: user._id.toHexString(),
    name: user.name,
    roles: user.roles,
    trade: user.trade,
    zone: user.zone,
    bio: user.bio,
    years: user.years,
    createdAt: user.createdAt,
    phoneVerified: user.phoneVerified,
    emailVerified: user.emailVerified,
    ratingSum: user.ratingSum,
    ratingCount: user.ratingCount,
    jobsDone: user.jobsDone,
    ...(includePrivate ? { email: user.email, phone: user.phone } : {}),
  };
}

export async function createAccount(input: {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: AccountRole | "ambos";
  trade?: string;
  zone: string;
  contactConsent: true;
}) {
  const db = await getDb();
  const users = db.collection<UserDoc>("users");
  const email = input.email.trim().toLowerCase();
  if (await users.findOne({ email }, { projection: { _id: 1 } })) {
    throw new Error("Ya existe una cuenta con ese correo.");
  }
  const salt = randomBytes(16).toString("hex");
  const passwordHash = `${salt}:${scryptSync(input.password, salt, 64).toString("hex")}`;
  const user: UserDoc = {
    _id: new ObjectId(),
    name: input.name.trim(),
    email,
    phone: input.phone.trim(),
    passwordHash,
    roles: input.role === "ambos" ? ["cliente", "profesional"] : [input.role],
    ...(input.role !== "cliente" && input.trade ? { trade: input.trade } : {}),
    zone: input.zone.trim(),
    bio: "",
    years: 0,
    createdAt: new Date(),
    phoneVerified: false,
    contactConsent: input.contactConsent,
    emailVerified: false,
    ratingSum: 0,
    ratingCount: 0,
    jobsDone: 0,
  };
  try {
    await users.insertOne(user);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === 11000) {
      throw new Error("Ya existe una cuenta con ese correo.");
    }
    throw error;
  }
  await issueSession(user._id);
  return publicUser(user, true);
}

export async function loginAccount(emailInput: string, password: string) {
  const db = await getDb();
  const user = await db
    .collection<UserDoc>("users")
    .findOne({ email: emailInput.trim().toLowerCase() });
  const [salt, stored] = user?.passwordHash.split(":") ?? ["", ""];
  const expected = Buffer.from(stored, "hex");
  const actual = user ? scryptSync(password, salt, 64) : Buffer.alloc(64);
  if (!user || expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    throw new Error("Correo o contraseña incorrectos.");
  }
  await issueSession(user._id);
  return publicUser(user, true);
}

async function issueSession(userId: ObjectId) {
  const token = randomBytes(32).toString("base64url");
  const maxAge = 60 * 60 * 24 * 14;
  await (await getDb()).collection<SessionDoc>("sessions").insertOne({
    tokenHash: digest(token),
    userId,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + maxAge * 1000),
  });
  setSessionCookie(token, maxAge);
}

function readSessionToken() {
  const cookie = getRequestHeader("cookie") ?? "";
  const value = cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("subiwaza_session="));
  return value?.slice("subiwaza_session=".length) ?? null;
}

export async function currentUser() {
  const token = readSessionToken();
  if (!token) return null;
  const db = await getDb();
  const session = await db
    .collection<SessionDoc>("sessions")
    .findOne({ tokenHash: digest(token), expiresAt: { $gt: new Date() } });
  if (!session) return null;
  const user = await db.collection<UserDoc>("users").findOne({ _id: session.userId });
  return user ? publicUser(user, true) : null;
}

export async function requireUser(role?: AccountRole) {
  const user = await currentUser();
  if (!user) throw new Error("Inicia sesión para continuar.");
  if (role && !user.roles.includes(role))
    throw new Error("Tu cuenta no tiene acceso a esta función.");
  return user;
}

export async function logoutAccount() {
  const token = readSessionToken();
  if (token)
    await (
      await getDb()
    )
      .collection<SessionDoc>("sessions")
      .deleteOne({ tokenHash: digest(token) });
  setSessionCookie("", 0);
}

export async function updateAccountProfile(input: {
  name: string;
  phone: string;
  zone: string;
  bio: string;
  years: number;
  trade?: string;
  addRole?: AccountRole;
}) {
  const viewer = await requireUser();
  const db = await getDb();
  const update: {
    $set: Partial<UserDoc>;
    $addToSet?: { roles: AccountRole };
  } = {
    $set: {
      name: input.name.trim(),
      phone: input.phone.trim(),
      zone: input.zone.trim(),
      bio: input.bio.trim(),
      years: input.years,
      ...(input.phone.trim() !== viewer.phone ? { phoneVerified: false } : {}),
      ...(input.trade ? { trade: input.trade } : {}),
    },
  };
  if (input.addRole) update.$addToSet = { roles: input.addRole };
  await db.collection<UserDoc>("users").updateOne({ _id: new ObjectId(viewer.id) }, update);
  const refreshed = await db.collection<UserDoc>("users").findOne({ _id: new ObjectId(viewer.id) });
  if (!refreshed) throw new Error("No encontramos tu cuenta. Vuelve a iniciar sesión.");
  return publicUser(refreshed, true);
}
