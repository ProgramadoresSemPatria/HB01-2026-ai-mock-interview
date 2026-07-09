import HeroSection from "@/components/sections/hero-section";
import TesteSection from "@/components/sections/teste-section";

export default function Home() {
  return (
    <div className="landing-canvas min-h-screen">
      <div>
        <HeroSection />
        <TesteSection />
      </div>
    </div>
  );
}
