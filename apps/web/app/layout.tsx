import type { Metadata } from "next";
import "@fontsource-variable/space-grotesk/wght.css";
import "@fontsource-variable/geist/wght.css";
import "@fontsource-variable/geist-mono/wght.css";
import "./globals.css";
import "./riverthree-fonts.css";
import "./riverthree-v418.css";
import "./agesoma-brand.css";
import "./agesoma-visual-system.css";
import "./jarvis.css";

export const metadata: Metadata = {
  title: "AGESOMA",
  description: "Converse com a inteligência da sua empresa."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
