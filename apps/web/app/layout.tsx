import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "InstantWork",
  description: "Diga o resultado que precisa. O InstantWork faz o trabalho e mostra o que foi comprovado."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
