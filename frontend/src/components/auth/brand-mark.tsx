import Link from "next/link";
import Image from "next/image";

import logo from "@/assets/logo.png";

export function BrandMark() {
  return (
    <Link href="/" className="inline-flex items-center gap-3">
      <Image src={logo} alt="Hone" width={120} height={32} priority />
    </Link>
  );
}
