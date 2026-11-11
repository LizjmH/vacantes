import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { promisify } from "node:util";
const scrypt = promisify(scryptCallback);
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const key = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${key.toString("hex")}`;
}
export async function verifyPassword(password: string, hash: string) {
  const parts = hash.split(":");
  const valid =
    parts.length === 3 &&
    parts[0] === "scrypt" &&
    /^[a-f0-9]{32}$/.test(parts[1]) &&
    /^[a-f0-9]{128}$/.test(parts[2]);
  const key = (await scrypt(
    password,
    valid ? parts[1] : "0".repeat(32),
    64,
  )) as Buffer;
  return (
    timingSafeEqual(
      key,
      Buffer.from(valid ? parts[2] : "00".repeat(64), "hex"),
    ) && valid
  );
}
export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
