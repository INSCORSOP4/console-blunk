"use client";

import {
  BookOpen,
  ClipboardList,
  History,
  LayoutDashboard,
  Ticket,
  Users,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BrandMark } from "./brand-mark";
import { ThemeToggle } from "./theme-toggle";
import { LogoutButton, UserMenu } from "./user-menu";

const NAV = [
  { href: "/dashboard", label: "Tablero", icon: LayoutDashboard },
  { href: "/tickets", label: "Tickets", icon: Ticket },
  { href: "/tecnicos", label: "Técnicos", icon: Users },
  { href: "/conocimiento", label: "Conocimiento", icon: BookOpen },
  { href: "/bitacora", label: "Bitácora", icon: ClipboardList },
  { href: "/utilerias", label: "Utilerías", icon: Wrench },
  { href: "/auditoria", label: "Auditoría", icon: History },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  // La pantalla de login se muestra sin barra lateral ni navegación.
  if (pathname === "/login") return <>{children}</>;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[15.5rem_1fr]">
      {/* Salto al contenido para navegación con teclado */}
      <a
        href="#contenido"
        className="bg-primary text-primary-foreground sr-only z-50 rounded-md px-4 py-2 text-sm font-medium focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Saltar al contenido
      </a>

      {/* Barra lateral (escritorio) */}
      <aside className="bg-sidebar text-sidebar-foreground border-sidebar-border sticky top-0 hidden h-screen flex-col justify-between border-r p-5 lg:flex">
        <div>
          <Link
            href="/dashboard"
            aria-label="Soporte Blunk, ir al tablero"
            className="block rounded-md py-1"
          >
            <BrandMark />
          </Link>

          <nav className="mt-10 flex flex-col gap-1" aria-label="Principal">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={cn(
                  "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive(href) && "bg-sidebar-accent text-sidebar-accent-foreground",
                )}
              >
                {isActive(href) && (
                  <span
                    aria-hidden
                    className="bg-sidebar-primary absolute top-1/2 -left-5 h-5 w-1 -translate-y-1/2 rounded-r"
                  />
                )}
                <Icon className="size-4" />
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="space-y-4">
          <UserMenu />
          <div className="flex items-end justify-between gap-2">
            <p className="text-sidebar-foreground/60 font-mono text-xs leading-relaxed tracking-wide uppercase">
              ServiceDesk Plus
              <br />
              Solo lectura
            </p>
            <ThemeToggle className="text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        {/* Barra superior (móvil): objetivos de 44 px */}
        <header className="bg-background/90 sticky top-0 z-30 flex items-center justify-between gap-2 border-b px-3 py-1.5 backdrop-blur lg:hidden">
          <Link
            href="/dashboard"
            aria-label="Soporte Blunk, ir al tablero"
            className="flex min-h-11 items-center rounded-md px-1"
          >
            <BrandMark compact />
          </Link>
          <div className="flex items-center">
            <nav className="flex" aria-label="Principal">
              {NAV.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  aria-label={label}
                  aria-current={isActive(href) ? "page" : undefined}
                  className={cn(
                    "text-muted-foreground grid size-11 place-items-center rounded-md",
                    isActive(href) && "bg-accent text-foreground",
                  )}
                >
                  <Icon className="size-5" />
                </Link>
              ))}
            </nav>
            <ThemeToggle />
            <LogoutButton />
          </div>
        </header>

        <main
          id="contenido"
          tabIndex={-1}
          className="mx-auto w-full max-w-[88rem] flex-1 px-4 py-6 outline-none sm:px-8 sm:py-9"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
