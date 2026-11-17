import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { UserForm } from "@/components/UserForm";
export const dynamic = "force-dynamic";
export default async function SetupPage() {
  if ((await prisma.usuario.count()) > 0) redirect("/auth/login");
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-lg rounded-3xl border border-line bg-panel p-8 shadow-2xl shadow-black/5 sm:p-12">
        <UserForm initial />
      </div>
    </main>
  );
}
