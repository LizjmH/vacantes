import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import * as passwords from "../src/lib/password.ts";

const require = createRequire(import.meta.url);
function service(prisma) {
  const source = readFileSync(
    new URL("../src/services/auth.service.ts", import.meta.url),
    "utf8",
  );
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const exports = {};
  runInNewContext(outputText, {
    exports,
    Date,
    require(name) {
      if (name === "server-only") return {};
      if (name === "@/lib/prisma") return { prisma };
      if (name === "@/lib/password") return passwords;
      if (name === "@/lib/auth")
        return { SESSION_DURATION: 8 * 60 * 60 * 1000 };
      return require(name);
    },
  });
  return exports;
}

test("authentication rejects unknown users and wrong passwords", async () => {
  const contra = await passwords.hashPassword("Una contraseña de prueba");
  let user = { id: "test-user", contra };
  const auth = service({ usuario: { findUnique: async () => user } });
  assert.equal(
    (await auth.authenticate("test@example.test", "Una contraseña de prueba"))
      .id,
    "test-user",
  );
  assert.equal(
    await auth.authenticate("test@example.test", "incorrecta"),
    null,
  );
  user = null;
  assert.equal(
    await auth.authenticate("test@example.test", "Una contraseña de prueba"),
    null,
  );
});

test("sessions store a digest, expire after eight hours and revoke by digest", async () => {
  const deletions = [];
  let created;
  const tx = {
    sesion: {
      deleteMany: async (q) => deletions.push(q),
      create: async (q) => {
        created = q.data;
      },
    },
  };
  const auth = service({
    $transaction: async (callback) => callback(tx),
    sesion: tx.sesion,
  });
  const session = await auth.createSession("test-user", "previous-token");
  assert.match(session.token, /^[a-f0-9]{64}$/);
  assert.equal(created.token, passwords.hashSessionToken(session.token));
  assert.equal(created.usuarioId, "test-user");
  assert.equal(created.expiraEl - created.creadoEl, 8 * 60 * 60 * 1000);
  assert.equal(
    deletions[0].where.token,
    passwords.hashSessionToken("previous-token"),
  );
  await auth.revokeSession(session.token);
  assert.equal(deletions.at(-1).where.token, created.token);
});

test("initial registration is closed once a user exists", async () => {
  let locked = false;
  let created = false;
  const tx = {
    $executeRaw: async () => {
      locked = true;
    },
    usuario: {
      count: async () => {
        assert.equal(locked, true);
        return 1;
      },
      create: async () => {
        created = true;
      },
    },
  };
  const auth = service({ $transaction: async (callback) => callback(tx) });
  assert.equal(
    await auth.createUser(
      "test@example.test",
      "Una contraseña de prueba",
      true,
    ),
    null,
  );
  assert.equal(created, false);
});
