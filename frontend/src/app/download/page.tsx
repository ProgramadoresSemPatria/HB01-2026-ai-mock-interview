import type { Metadata } from "next";

import "@/components/download/download.css";

import DownloadBenefits from "@/components/download/download-benefits";
import DownloadCtaBand from "@/components/download/download-cta-band";
import DownloadFaq from "@/components/download/download-faq";
import DownloadHero from "@/components/download/download-hero";
import DownloadVideoSection from "@/components/download/download-video-section";
import PlatformTabs from "@/components/download/platform-tabs";
import LandingFooter from "@/components/landing/landing-footer";
import LandingNavbar from "@/components/landing/landing-navbar";
import { getSiteLocale } from "@/features/site-locale/get-site-locale";
import { SiteLocaleProvider } from "@/features/site-locale/site-locale-provider";

// Metadata stays in English: it is static and shared by both site locales.
const TITLE = "Get the Hone app — practice interviews anywhere";
const DESCRIPTION =
  "Install Hone on your iPhone, Android or desktop. Resume-aware AI mock interviews, instant feedback and your study backlog — full screen, one tap away, no app store.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    siteName: "Hone",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default async function DownloadPage() {
  // Read on the server so PT visitors get Portuguese HTML (no EN flash).
  const locale = await getSiteLocale();

  return (
    <SiteLocaleProvider initialLocale={locale}>
      <div className="landing-canvas">
        <LandingNavbar />
        <main>
          <DownloadHero />
          <DownloadVideoSection />
          <DownloadBenefits />
          <PlatformTabs />
          <DownloadFaq />
          <DownloadCtaBand />
        </main>
        <LandingFooter />
      </div>
    </SiteLocaleProvider>
  );
}
