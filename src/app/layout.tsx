import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Buscador | Next.js + Prisma",
  description: "Proyecto inicial con Next.js, TypeScript, Prisma y PostgreSQL.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="es"><body>{children}</body></html>;
}
