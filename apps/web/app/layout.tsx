import type { Metadata } from "next";
import "@fontsource-variable/space-grotesk/wght.css";
import "@fontsource-variable/geist/wght.css";
import "@fontsource-variable/geist-mono/wght.css";
import "./globals.css";
import "./riverthree-fonts.css";
import "./riverthree-v418.css";
import "./agesoma-brand.css";
import "./agesoma-visual-system.css";
import "./agesoma-conversation.css";
import "./settings.css";
import "./age-tokens.css";

export const metadata: Metadata = {
  title: "AGESOMA",
  description: "Agentes operacionais que sua empresa configura e contrata online."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
