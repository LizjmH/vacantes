import { prisma } from "@/lib/prisma";
import { createNote } from "./actions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function Home() {
  const notes = await prisma.note.findMany({ orderBy: { createdAt: "desc" }, take: 50 });

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-20">
      <p className="mb-3 text-sm font-semibold tracking-widest text-emerald-700">BUSCADOR / PROYECTO INICIAL</p>
      <h1 className="text-4xl font-bold tracking-tight">Next.js + Prisma</h1>
      <p className="mt-4 text-slate-600">Tu proyecto está listo. Crea una nota para probar la conexión con PostgreSQL.</p>
      <form action={createNote} className="my-8 flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label htmlFor="title" className="mb-2 block text-sm font-medium">Nueva nota</label>
          <input id="title" name="title" required maxLength={200} placeholder="Mi primera nota" className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-offset-4" />
        </div>
        <button className="self-end rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white hover:bg-emerald-800">Guardar nota</button>
      </form>
      <h2 className="mb-4 text-lg font-semibold">Notas recientes</h2>
      {notes.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 p-6 text-slate-500">Todavía no hay notas. Agrega la primera arriba.</p>
      ) : (
        <ul className="space-y-3">
          {notes.map((note) => <li key={note.id} className="break-words rounded-xl border border-slate-200 bg-white p-4">{note.title}</li>)}
        </ul>
      )}
    </main>
  );
}
