"use client";
import ImageParallax from "../landing-page/image-parallax";
import heroImage from "../../assets/logo.png";

const HeroSection = () => {
  return (
    <section
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-end",
        height: "100vh",
      }}
    >
      <ImageParallax
        src={heroImage}
        alt="Hone"
        width="min(75vw, 800px)"
        height="min(75vw, 800px)"
        intensity={100}
        overscan={35}
        noiseOpacity={0.35}
        objectPosition="center"
        noiseIntensity={30}
        startOffset={-30}          // começa ~30px mais pra cima
        springConfig={{ stiffness: 100, damping: 50, mass: 0.6 }}
      />
    </section>
  );
};

export default HeroSection;