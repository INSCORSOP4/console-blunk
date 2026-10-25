import Image from "next/image";
import { cn } from "@/lib/utils";

// Isotipo oficial de Blunk en una tinta: negro para fondos claros, blanco para fondos oscuros.
// Relación recortada del archivo original: 240 × 119.
function Isotipo({ className }: { className?: string }) {
  return (
    <>
      <Image
        src="/brand/isotipo-negro.png"
        alt=""
        width={240}
        height={119}
        priority
        className={cn("h-auto dark:hidden", className)}
      />
      <Image
        src="/brand/isotipo-blanco.png"
        alt=""
        width={240}
        height={119}
        priority
        className={cn("hidden h-auto dark:block", className)}
      />
    </>
  );
}

/** Logo + nombre del sistema. El texto es el nombre accesible del enlace; las imágenes son decorativas. */
export function BrandMark({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("flex items-center gap-3", className)}>
      <Isotipo className={compact ? "w-10" : "w-14"} />
      <span
        className={cn(
          "font-display leading-[1.05] font-bold tracking-[0.08em] uppercase",
          compact ? "hidden text-sm min-[440px]:block" : "text-[0.95rem]",
        )}
      >
        Soporte
        <span className="text-signal block">Blunk</span>
      </span>
    </span>
  );
}
