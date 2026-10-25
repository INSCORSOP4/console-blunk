import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TicketDetail } from "@/modules/tickets/ticket-detail";

export async function generateMetadata({ params }: PageProps<"/tickets/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: `Ticket #${id}` };
}

export default async function TicketPage({ params }: PageProps<"/tickets/[id]">) {
  const { id } = await params;
  // Solo enteros positivos; cualquier otra cosa es un 404 sin llegar a la API.
  if (!/^\d{1,15}$/.test(id) || Number(id) <= 0) notFound();
  return <TicketDetail id={Number(id)} />;
}
