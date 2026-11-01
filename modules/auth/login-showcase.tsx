import { ArrowRight, CheckCircle2, Shield, Users, Workflow } from "lucide-react";
import Image from "next/image";

/**
 * Panel decorativo del login (solo visible en pantallas grandes).
 * Diseño minimalista estilo dealor.mx - solo lo esencial.
 */
export function LoginShowcase() {
  return (
    <div className="relative isolate hidden h-full overflow-hidden lg:flex lg:flex-col lg:justify-center lg:px-12 xl:px-16">
      {/* Fondo minimalista */}
      <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
        <div className="showcase-glow-a" />
        <div className="showcase-glow-b" />
        <div className="showcase-grid" />
      </div>

      {/* Contenido centrado y limpio */}
      <div className="mx-auto max-w-md">
        {/* Heading principal */}
        <h2 className="font-display text-3xl font-semibold tracking-tight">
          Tu centro de control
        </h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Todo tu soporte en un solo lugar
        </p>

        {/* Features minimalistas */}
        <ul className="mt-8 space-y-4">
          <li className="flex items-center gap-3 text-sm">
            <div className="flex size-8 items-center justify-center rounded-lg bg-ok/10">
              <Workflow className="size-4 text-ok" />
            </div>
            <span>Gestión de tickets en tiempo real</span>
          </li>
          <li className="flex items-center gap-3 text-sm">
            <div className="flex size-8 items-center justify-center rounded-lg bg-signal/10">
              <Users className="size-4 text-signal" />
            </div>
            <span>Bitácora de actividades</span>
          </li>
          <li className="flex items-center gap-3 text-sm">
            <div className="flex size-8 items-center justify-center rounded-lg bg-warn/10">
              <Shield className="size-4 text-warn" />
            </div>
            <span>Jobs automatizados</span>
          </li>
        </ul>

        {/* Estado activo */}
        <div className="mt-8 flex items-center gap-2 text-xs">
          <span className="flex size-2 items-center justify-center">
            <span className="absolute inline-flex size-2 animate-ping rounded-full bg-ok opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-ok" />
          </span>
          <span className="text-muted-foreground">Sistema operando con normalidad</span>
        </div>

        {/* Stats simples */}
        <div className="mt-6 flex gap-6">
          <div>
            <p className="text-2xl font-semibold text-signal">42</p>
            <p className="text-muted-foreground text-xs">tickets abiertos</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-ok">98%</p>
            <p className="text-muted-foreground text-xs">SLA cumplimiento</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-warn">12</p>
            <p className="text-muted-foreground text-xs">usuarios en línea</p>
          </div>
        </div>
      </div>

      {/* Mascota sutil */}
      <div className="pointer-events-none absolute right-8 bottom-8 hidden w-24 xl:block">
        <Image
          src="/mascota/linki-hola.svg"
          alt=""
          aria-hidden
          width={291}
          height={429}
          priority
          unoptimized
          className="linki-flotar w-full opacity-80"
        />
      </div>
    </div>
  );
}