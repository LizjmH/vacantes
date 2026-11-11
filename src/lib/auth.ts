import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashSessionToken } from "@/lib/password";
export const SESSION_COOKIE = "vacantes.session";
export const SESSION_DURATION = 8 * 60 * 60 * 1000;
export const getSession = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  return prisma.sesion.findFirst({
    where: { token: hashSessionToken(token), expiraEl: { gt: new Date() } },
    select: {
      id: true,
      expiraEl: true,
      usuario: { select: { id: true, correo: true } },
    },
  });
});
// Validate again inside every protected page/action/handler that accesses data.
export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/auth/login");
  return session;
}
