import "server-only";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword, hashSessionToken, verifyPassword } from "@/lib/password";
import { SESSION_DURATION } from "@/lib/auth";
export async function authenticate(correo: string, password: string) {
  const user = await prisma.usuario.findUnique({ where: { correo } });
  const valid = await verifyPassword(password, user?.contra ?? "");
  return user && valid ? { id: user.id } : null;
}
export async function createSession(usuarioId: string, previousToken?: string) {
  const token = randomBytes(32).toString("hex");
  const now = new Date();
  const expiraEl = new Date(now.getTime() + SESSION_DURATION);
  await prisma.$transaction(async (tx) => {
    if (previousToken)
      await tx.sesion.deleteMany({
        where: { token: hashSessionToken(previousToken) },
      });
    await tx.sesion.deleteMany({
      where: { usuarioId, expiraEl: { lte: now } },
    });
    await tx.sesion.create({
      data: {
        usuarioId,
        token: hashSessionToken(token),
        expiraEl,
        creadoEl: now,
      },
    });
  });
  return { token, expiraEl };
}
export async function revokeSession(token: string) {
  await prisma.sesion.deleteMany({ where: { token: hashSessionToken(token) } });
}
export async function createUser(
  correo: string,
  password: string,
  firstUser: boolean,
) {
  const contra = await hashPassword(password);
  return prisma.$transaction(async (tx) => {
    // Serialize initial registration: concurrent requests cannot both create the first user.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(784213)`;
    if (firstUser && (await tx.usuario.count()) > 0) return null;
    return tx.usuario.create({
      data: { correo, contra },
      select: { id: true },
    });
  });
}
