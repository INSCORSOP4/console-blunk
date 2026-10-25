import Image from "next/image";
import { Button } from "@/components/ui/button";

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message = error instanceof Error ? error.message : "Ocurrió un error inesperado.";
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-8 text-center"
    >
      <Image
        src="/mascota/linki-atencion.svg"
        alt=""
        aria-hidden
        width={300}
        height={429}
        unoptimized
        className="h-20 w-auto"
      />
      <div>
        <p className="font-medium">No se pudieron cargar los datos</p>
        <p className="text-muted-foreground mt-1 text-sm">{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-8 text-center">
      <Image
        src="/mascota/linki-listo.svg"
        alt=""
        aria-hidden
        width={290}
        height={429}
        unoptimized
        className="h-20 w-auto"
      />
      <p className="font-medium">{title}</p>
      {hint && <p className="text-muted-foreground text-sm">{hint}</p>}
    </div>
  );
}
