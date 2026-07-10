import Navbar from "@/components/landing/navbar";
import LandingSections from "@/components/landing/sections/landing-sections";

export default function Home() {
  return (
    <div className="landing-canvas">
      <Navbar />
      <div>
        <LandingSections />
      </div>
    </div>
  );
}
