"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createNote(formData: FormData) {
  const title = formData.get("title");
  if (typeof title !== "string" || !title.trim() || title.trim().length > 200) {
    throw new Error("Escribe un título de entre 1 y 200 caracteres.");
  }
  await prisma.note.create({ data: { title: title.trim() } });
  revalidatePath("/");
}
