import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Manrope } from "next/font/google";

import "../index.css";
import Providers from "@/components/providers/providers";
import { InstallPrompt } from "@/features/pwa/install-prompt";
import { PWA_INSTALL_CAPTURE_SCRIPT } from "@/features/pwa/pwa-install-store";
import { ServiceWorkerRegistration } from "@/features/pwa/service-worker-registration";

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: "Hone ",
  description:
    "AI Mock Interview, technical interview preparation, structured feedback, guided practice with AI.",
  applicationName: "Hone",
  // The manifest <link> comes from src/app/manifest.ts and the
  // apple-touch-icon from src/app/apple-icon.png (both basePath-aware).
  appleWebApp: {
    capable: true,
    title: "Hone",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
    date: false,
  },
};

// Light-only app (ThemeProvider forces "light"): one theme color, matching
// --color-paper-white, the canvas behind every page.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${instrumentSerif.variable} ${manrope.variable}`}
    >
      <head>
        {/* Captures beforeinstallprompt before hydration (see features/pwa). */}
        <script
          dangerouslySetInnerHTML={{ __html: PWA_INSTALL_CAPTURE_SCRIPT }}
        />
      </head>
      <body className="min-h-dvh antialiased">
        <Providers>
          {children}
          <InstallPrompt />
        </Providers>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
