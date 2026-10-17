import type { Metadata } from "next";
import "@fontsource-variable/manrope/wght.css";
import "@fontsource-variable/inter/wght.css";
import "@fontsource-variable/jetbrains-mono/wght.css";
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
import "./age-product-bridge.css";
import "./linear-midnight.css";

export const metadata: Metadata = {
  title: "Instant — plataforma de produtos",
  description: "Produtos Instant e futura família Dots, com serviços reutilizáveis e identidades independentes."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
