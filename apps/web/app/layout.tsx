import type { Metadata } from "next";
import "@fontsource-variable/space-grotesk/wght.css";
import "@fontsource-variable/geist/wght.css";
import "@fontsource-variable/geist-mono/wght.css";
import "./globals.css";
import "./riverthree-fonts.css";
import "./riverthree-v418.css";
import "./agesoma-brand.css";

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
