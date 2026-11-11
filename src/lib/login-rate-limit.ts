import "server-only";
import { createHash } from "node:crypto";
// Single-process protection; use shared storage when deploying multiple instances.
const attempts = new Map<string, { count: number; until: number }>();
export function allowLogin(correo: string) {
  const now = Date.now();
  for (const [key, value] of attempts)
    if (value.until <= now) attempts.delete(key);
  const key = createHash("sha256").update(correo).digest("hex");
  const value = attempts.get(key);
  if ((value && value.count >= 5) || (!value && attempts.size >= 10000))
    return false;
  attempts.set(key, {
    count: (value?.count ?? 0) + 1,
    until: value?.until ?? now + 15 * 60 * 1000,
  });
  return true;
}
export function resetLoginAttempts(correo: string) {
  attempts.delete(createHash("sha256").update(correo).digest("hex"));
}
