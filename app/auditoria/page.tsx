import type { Metadata } from "next";
import { AuditoriaView } from "@/modules/auditoria/auditoria-view";

export const metadata: Metadata = { title: "Auditoría" };

export default function AuditoriaPage() {
  return <AuditoriaView />;
}
