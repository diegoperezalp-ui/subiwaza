import { redirect } from "@tanstack/react-router";
import { getCurrentUser } from "./auth.functions";
import type { PublicUser } from "./auth.server";

export type DashboardPath = "/panel/cliente" | "/panel/especialista";

export function dashboardPath(user: PublicUser): DashboardPath {
  return user.roles.includes("cliente") ? "/panel/cliente" : "/panel/especialista";
}

export async function requireAccount(role?: "cliente" | "profesional") {
  const user = await getCurrentUser();
  if (!user) throw redirect({ to: "/acceso" });
  if (role && !user.roles.includes(role)) {
    throw redirect({ to: dashboardPath(user) });
  }
  return user;
}
