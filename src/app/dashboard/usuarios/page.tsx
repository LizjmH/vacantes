import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { UserForm } from "@/components/UserForm";
export default async function UsersPage() {
  await requireSession();
  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-10">
      <div className="mx-auto max-w-lg">
        <Link
          href="/dashboard"
          className="mb-6 inline-block text-sm underline underline-offset-4"
        >
          ← Volver al inicio
        </Link>
        <div className="rounded-3xl border border-neutral-200 bg-white p-8 sm:p-12">
          <UserForm />
        </div>
      </div>
    </main>
  );
}
