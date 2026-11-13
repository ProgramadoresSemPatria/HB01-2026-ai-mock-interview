import LandingNavbar from "@/components/landing/landing-navbar";
import LandingSections from "@/components/landing/sections/landing-sections";
import { getSiteLocale } from "@/features/site-locale/get-site-locale";
import { SiteLocaleProvider } from "@/features/site-locale/site-locale-provider";

export default async function Home() {
  // Read on the server so PT visitors get Portuguese HTML (no EN flash).
  const locale = await getSiteLocale();

  return (
    <SiteLocaleProvider initialLocale={locale}>
      <div className="landing-canvas">
        <LandingNavbar />
        <LandingSections />
      </div>
    </SiteLocaleProvider>
  );
}
