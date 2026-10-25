import { Skeleton } from "@/components/ui/skeleton";
import type { Sla } from "@/lib/api/schemas";
import { fmtNum, fmtPct } from "@/lib/format";

const R = 52;
const C = 2 * Math.PI * R;

export function SlaRing({ sla }: { sla?: Sla }) {
  if (!sla) return <Skeleton className="mx-auto size-40 rounded-full" />;

  const pct = Math.max(0, Math.min(100, sla.porcentajeCumplimiento));
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
      <div className="relative size-40 shrink-0">
        <svg
          viewBox="0 0 120 120"
          className="size-full -rotate-90"
          role="img"
          aria-label={`Cumplimiento de SLA ${fmtPct(pct)}`}
        >
          <circle cx="60" cy="60" r={R} fill="none" stroke="var(--muted)" strokeWidth="11" />
          <circle
            cx="60"
            cy="60"
            r={R}
            fill="none"
            stroke="var(--ok)"
            strokeWidth="11"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C - (C * pct) / 100}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="num font-display text-3xl leading-none font-semibold">{fmtPct(pct, 1)}</p>
            <p className="eyebrow mt-1">en tiempo</p>
          </div>
        </div>
      </div>
      <dl className="grid w-full grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-1">
        <Dato etiqueta="En tiempo" valor={fmtNum(sla.enTiempo)} punto="bg-ok" />
        <Dato etiqueta="Vencidos" valor={fmtNum(sla.vencidos)} punto="bg-danger" />
        <Dato etiqueta="Total" valor={fmtNum(sla.total)} punto="bg-foreground/30" />
      </dl>
    </div>
  );
}

function Dato({ etiqueta, valor, punto }: { etiqueta: string; valor: string; punto: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted-foreground flex items-center gap-2">
        <span className={`size-2 rounded-full ${punto}`} />
        {etiqueta}
      </dt>
      <dd className="num font-mono">{valor}</dd>
    </div>
  );
}
