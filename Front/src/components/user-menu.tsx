// TODO: Reimplementar quando auth MVC backend estiver pronto
// Por enquanto, stub simples para permitir build

import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function UserMenu() {
  return (
    <Link href="/login">
      <Button variant="outline">Sign In</Button>
    </Link>
  );
}
