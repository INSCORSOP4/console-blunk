"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Loader2, LogOut } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSesion } from "@/lib/api/queries";

/** Cierra la sesión: borra la cookie en el servidor, limpia la caché de datos y vuelve al login. */
function useLogout() {
  const client = useQueryClient();
  const [pending, setPending] = useState(false);

  async function logout() {
    if (pending) return;
    setPending(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      client.clear();
      // Navegación completa a propósito: reinicia la memoria de la app y la sesión del navegador.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/login");
    }
  }
  return { logout, pending };
}

/** Bloque de usuario de la barra lateral (escritorio). */
export function UserMenu() {
  const { data: sesion, isPending } = useSesion();
  const { logout, pending } = useLogout();

  return (
    <div className="border-sidebar-border flex items-center gap-3 rounded-md border p-3">
      <div className="min-w-0 flex-1">
        {isPending ? (
          <Skeleton className="h-8 w-full" />
        ) : (
          <>
            <p className="truncate text-sm font-medium" title={sesion?.nombre}>
              {sesion?.nombre ?? "Sesión"}
            </p>
            <p
              className="text-sidebar-foreground/60 truncate font-mono text-xs"
              title={sesion?.email}
            >
              {sesion?.email}
            </p>
          </>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={logout}
        disabled={pending}
        aria-label="Cerrar sesión"
        title="Cerrar sesión"
        className="text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground shrink-0"
      >
        {pending ? <Loader2 className="animate-spin" /> : <LogOut />}
      </Button>
    </div>
  );
}

/** Botón de cerrar sesión para la barra superior móvil (objetivo táctil de 44 px). */
export function LogoutButton() {
  const { logout, pending } = useLogout();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={logout}
      disabled={pending}
      aria-label="Cerrar sesión"
      className="text-muted-foreground size-11"
    >
      {pending ? <Loader2 className="animate-spin" /> : <LogOut />}
    </Button>
  );
}
