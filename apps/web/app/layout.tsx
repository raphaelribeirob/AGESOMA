import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AGESOMA",
  description: "Diga o resultado que precisa. A AGESOMA faz o trabalho e mostra o que foi comprovado."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
