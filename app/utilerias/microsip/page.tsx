import type { Metadata } from "next";
import { MicrosipView } from "@/modules/utilerias/microsip-view";

export const metadata: Metadata = { title: "Usuarios MICROSIP" };

export default function MicrosipPage() {
  return <MicrosipView />;
}
