import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  createAccount,
  currentUser,
  loginAccount,
  logoutAccount,
  updateAccountProfile,
} from "./auth.server";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254),
  phone: z
    .string()
    .trim()
    .min(10)
    .max(24)
    .regex(/^\+?[\d\s().-]+$/),
  password: z.string().min(10).max(128),
  role: z.enum(["cliente", "profesional", "ambos"]),
  contactConsent: z.literal(true),
  trade: z.string().optional(),
  zone: z.string().trim().min(2).max(80),
});

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
});
const profileSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z
    .string()
    .trim()
    .min(10)
    .max(24)
    .regex(/^\+?[\d\s().-]+$/),
  zone: z.string().trim().min(2).max(80),
  bio: z.string().trim().max(700),
  years: z.number().int().min(0).max(60),
  trade: z.string().max(40).optional(),
  addRole: z.enum(["cliente", "profesional"]).optional(),
});

export const getCurrentUser = createServerFn({ method: "GET" }).handler(async () => currentUser());

export const registerUser = createServerFn({ method: "POST" })
  .validator(registerSchema)
  .handler(async ({ data }) => {
    if ((data.role === "profesional" || data.role === "ambos") && !data.trade)
      throw new Error("Elige tu oficio para crear el perfil profesional.");
    return createAccount(data);
  });

export const loginUser = createServerFn({ method: "POST" })
  .validator(loginSchema)
  .handler(async ({ data }) => loginAccount(data.email, data.password));

export const logoutUser = createServerFn({ method: "POST" }).handler(async () => {
  await logoutAccount();
  return { ok: true };
});

export const updateProfile = createServerFn({ method: "POST" })
  .validator(profileSchema)
  .handler(async ({ data }) => {
    if (data.addRole === "profesional" && !data.trade)
      throw new Error("Elige tu oficio para activar tu perfil profesional.");
    return updateAccountProfile(data);
  });
