"use client";

import StaggeredMenu from "@/components/StaggeredMenu";
import logo from "@/assets/logo.png";

const menuItems = [
  { label: "Home", ariaLabel: "Go to home page", link: "/" },
  { label: "Features", ariaLabel: "View product features", link: "/#features" },
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
