import LandingNavbar from "@/components/landing/landing-navbar";
import LandingSections from "@/components/landing/sections/landing-sections";

export default function Home() {
  return (
    <div className="landing-canvas">
      <LandingNavbar />
      <LandingSections />
    </div>
  );
}
