import type { Metadata } from "next";
import "./globals.css";
import { themeBootstrap } from "@/lib/theme";

export const metadata: Metadata = {
  title: "Vacantes",
  description: "Sistema de gestión de empleadores y vacantes.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
