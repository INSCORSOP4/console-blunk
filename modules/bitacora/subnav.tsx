"use client";

import { ClipboardList, ListTree } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function BitacoraSubnav({
  rutaBase,
  nombrePlural,
}: {
  rutaBase: string;
  nombrePlural: string;
}) {
  const pathname = usePathname();
  const items = [
    { href: rutaBase, label: "Checklist diario", icon: ClipboardList },
    { href: `${rutaBase}/catalogo`, label: `Catálogo de ${nombrePlural}`, icon: ListTree },
  ];
  return (
    <nav aria-label="Bitácora" className="mb-6 flex gap-1 overflow-x-auto border-b">
      {items.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={pathname === href ? "page" : undefined}
          className={cn(
            "-mb-px flex min-h-11 items-center gap-2 border-b-2 border-transparent px-3 text-sm font-medium whitespace-nowrap transition-colors",
            pathname === href
              ? "border-signal text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Icon className="size-4" aria-hidden />
          {label}
        </Link>
      ))}
    </nav>
  );
}
