import Navbar from "@/components/navbar";
import LandingSections from "@/components/sections/landing-sections";

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
