import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocumentoView } from "@/modules/conocimiento/documento-view";

export const metadata: Metadata = { title: "Nota" };

export default async function NotaPage({ params }: PageProps<"/conocimiento/[id]">) {
  const { id } = await params;
  // Solo enteros positivos; cualquier otra cosa es un 404 sin llegar a la API.
  if (!/^\d{1,9}$/.test(id) || Number(id) <= 0) notFound();
  return <DocumentoView id={Number(id)} />;
}
