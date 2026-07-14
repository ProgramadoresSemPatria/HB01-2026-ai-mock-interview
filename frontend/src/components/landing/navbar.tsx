"use client";

import StaggeredMenu from "@/components/landing/staggered-menu/staggered-menu";
import logo from "@/assets/logo.png";

const menuItems = [
  { label: "Home", ariaLabel: "Go to home page", link: "/" },
  { label: "Features", ariaLabel: "View product features", link: "/#features" },
  { label: "Pricing", ariaLabel: "View pricing plans", link: "/#pricing" },
  { label: "Demo", ariaLabel: "View interview demo", link: "/#demo" },
  { label: "Login", ariaLabel: "Sign in to your account", link: "/login" },
];

const Navbar = () => {
  return (
    <StaggeredMenu
      isFixed
      position="right"
      items={menuItems}
      showCta
      ctaHref="/login"
      displaySocials={false}
      displayItemNumbering
      menuButtonColor="#fff"
      openMenuButtonColor="#111"
      changeMenuColorOnOpen
      colors={["#1c1c1c", "#2e2e2e", "#404040"]}
      logoUrl={logo}
    />
  );
};

export default Navbar;
