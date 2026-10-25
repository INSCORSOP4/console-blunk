import type { Metadata } from "next";
import { Suspense } from "react";
import { TicketsView } from "@/modules/tickets/tickets-view";

export const metadata: Metadata = { title: "Tickets" };

export default function TicketsPage() {
  // useSearchParams exige un límite de Suspense.
  return (
    <Suspense>
      <TicketsView />
    </Suspense>
  );
}
