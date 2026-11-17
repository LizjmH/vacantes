import { employerSections } from "./empresa-form";

type DraftStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
const fields = employerSections.flatMap((section) => section.fields);

export function readEmployerDraft(
  storage: DraftStorage,
  key: string,
): Record<string, string> | null {
  try {
    const raw = storage.getItem(key);
    if (!raw || raw.length > 64000) return null;
    const draft = JSON.parse(raw);
    if (
      draft?.version !== 1 ||
      !draft.values ||
      typeof draft.values !== "object"
    )
      return null;
    const values: Record<string, string> = {};
    for (const field of fields) {
      const value = draft.values[field.name];
      if (typeof value === "string")
        values[field.name] = value.slice(0, field.max ?? 100);
    }
    return Object.keys(values).length ? values : null;
  } catch {
    return null;
  }
}

export function writeEmployerDraft(
  storage: DraftStorage,
  key: string,
  values: Record<string, string>,
) {
  try {
    const safe = Object.fromEntries(
      fields.map((field) => [
        field.name,
        (values[field.name] ?? "").slice(0, field.max ?? 100),
      ]),
    );
    storage.setItem(key, JSON.stringify({ version: 1, values: safe }));
    return true;
  } catch {
    return false;
  }
}

export function removeEmployerDraft(storage: DraftStorage, key: string) {
  try {
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
