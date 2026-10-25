"use client";

import { BorderBeam, type BorderBeamColorVariant } from "border-beam";
import { useTheme } from "next-themes";
import { useState, useSyncExternalStore } from "react";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { cn } from "@/lib/utils";

const subscribe = () => () => {};

export type BeamMode = "hover" | "always" | "off";

/**
 * Haz de luz que recorre el borde de una tarjeta (librería `border-beam`, MIT).
 * - "hover": aparece solo al pasar el cursor (y se desvanece al salir).
 * - "always": permanente, para llamar la atención sobre algo (p. ej. tickets vencidos).
 * - "off": sin efecto.
 * Es decorativo (no recibe eventos) y se apaga con "reducir movimiento".
 */
export function BeamCard({
  children,
  mode = "hover",
  variant = "ocean",
  strength = 1,
  className,
}: {
  children: React.ReactNode;
  mode?: BeamMode;
  variant?: BorderBeamColorVariant;
  strength?: number;
  className?: string;
}) {
  const { resolvedTheme } = useTheme();
  const reducedMotion = useReducedMotion();
  const [hover, setHover] = useState(false);
  // El servidor no conoce el tema: hasta montar se usa "dark" en ambos lados para que la hidratación coincida.
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  const active = !reducedMotion && (mode === "always" || (mode === "hover" && hover));

  return (
    <BorderBeam
      size="md"
      colorVariant={variant}
      theme={mounted && resolvedTheme === "light" ? "light" : "dark"}
      strength={strength}
      duration={2.4}
      brightness={1.9}
      saturation={1.5}
      glowSize={1.2}
      staticColors
      active={active}
      className={cn("block h-full", className)}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
    >
      {children}
    </BorderBeam>
  );
}
