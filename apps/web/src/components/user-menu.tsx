// TODO: Reimplementar quando auth MVC backend estiver pronto
// Por enquanto, stub simples para permitir build

import { Button } from "@hackathon2026/ui/components/button";
import Link from "next/link";

export default function UserMenu() {
  return (
    <Link href="/login">
      <Button variant="outline">Sign In</Button>
    </Link>
  );
}
