import type { BorderBeamColorVariant } from "border-beam";
import { Skeleton } from "@/components/ui/skeleton";
import { BeamCard, type BeamMode } from "./beam-card";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "signal" | "danger" | "ok" | "warn";

const TONE: Record<Tone, string> = {
  neutral: "before:bg-foreground/25",
  signal: "before:bg-signal",
  danger: "before:bg-danger",
  ok: "before:bg-ok",
  warn: "before:bg-warn",
};

export function KpiCard({
  label,
  value,
  hint,
  tone = "neutral",
  loading,
  index = 0,
  beam = "hover",
  beamVariant = "ocean",
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone?: Tone;
  loading?: boolean;
  index?: number;
  /** Cuándo mostrar el haz de luz del borde. */
  beam?: BeamMode;
  beamVariant?: BorderBeamColorVariant;
}) {
  return (
    <BeamCard mode={beam} variant={beamVariant}>
      <div
        style={{ "--i": index } as React.CSSProperties}
        className={cn(
          "rise surface bg-card relative h-full overflow-hidden rounded-xl border p-4 pl-5 before:absolute before:inset-y-0 before:left-0 before:w-1",
          TONE[tone],
        )}
      >
        <p className="eyebrow">{label}</p>
        {loading ? (
          <Skeleton className="mt-3 h-9 w-24" />
        ) : (
          <p className="num font-display mt-2 text-4xl leading-none font-semibold tracking-tight">
            {value}
          </p>
        )}
        {hint && <p className="text-muted-foreground mt-2 text-xs">{hint}</p>}
      </div>
    </BeamCard>
  );
}
