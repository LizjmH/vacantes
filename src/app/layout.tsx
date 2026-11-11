import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vacantes",
  description: "Sistema de gestión de empleadores y vacantes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="es"><body>{children}</body></html>;
}
