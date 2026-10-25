import type { Metadata } from "next";
import { JobsView } from "@/modules/utilerias/jobs-view";

export const metadata: Metadata = { title: "Jobs de SQL Server" };

export default function JobsPage() {
  return <JobsView />;
}
