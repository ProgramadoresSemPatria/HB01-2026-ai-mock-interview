import type { Metadata } from "next";
import { Outfit, Playfair_Display } from "next/font/google";

import "../index.css";
import Providers from "@/components/providers";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hone | AI Mock Interview",
  description:
    "Landing page do AI Mock Interview com foco em preparacao tecnica, feedback estruturado e pratica guiada por IA.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${outfit.variable} ${playfairDisplay.variable} min-h-screen antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
