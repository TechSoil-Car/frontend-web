import type { ReactNode } from "react";
import { DashboardLayout } from "@/features/dashboard";

export default function AuthenticatedDashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
