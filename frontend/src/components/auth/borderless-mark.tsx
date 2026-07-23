import Image from "next/image";

import borderlessLogo from "@/assets/borderless-logo.png";

type BorderlessMarkProps = {
  className?: string;
};

export function BorderlessMark({ className }: BorderlessMarkProps) {
  return (
    <Image
      src={borderlessLogo}
      alt="Borderless"
      width={200}
      height={150}
      className={className}
      priority
    />
  );
}
