"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/features/auth";
import { usePlantations } from "@/features/plantations/context/PlantationContext";
import { DashboardHeader } from "../dashboard-header/DashboardHeader";
import { DashboardSidebar } from "../dashboard-sidebar/DashboardSidebar";
import styles from "./DashboardLayout.module.css";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { status: authStatus, user } = useAuth();
  const { selectedPlantation, status: plantationsStatus } = usePlantations();
  const router = useRouter();
  const pathname = usePathname();
  const isAdmin = user?.systemRole === "SUPERADMIN";
  const isAdminPage =
    pathname === "/dashboard/admin" || pathname.startsWith("/dashboard/admin/");
  const isProfilePage = pathname === "/dashboard/perfil";

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (authStatus === "authenticated" && isAdmin) {
      if (!isAdminPage && !isProfilePage) router.replace("/dashboard/admin");
      return;
    }
    if (
      authStatus === "authenticated" &&
      plantationsStatus === "ready" &&
      !selectedPlantation &&
      !isProfilePage &&
      pathname !== "/dashboard/organizacoes" &&
      pathname !== "/dashboard/equipe" &&
      pathname !== "/dashboard/plantacoes" &&
      !pathname.startsWith("/dashboard/admin")
    ) {
      router.replace("/dashboard/plantacoes");
    }
  }, [
    authStatus,
    pathname,
    plantationsStatus,
    router,
    selectedPlantation,
    isAdmin,
    isAdminPage,
    isProfilePage,
  ]);

  if (
    authStatus !== "authenticated" ||
    (isAdmin && !isAdminPage && !isProfilePage) ||
    (!isAdmin &&
      plantationsStatus === "loading" &&
      pathname !== "/dashboard/plantacoes" &&
      !isAdminPage &&
      pathname !== "/dashboard/organizacoes" &&
      pathname !== "/dashboard/equipe" &&
      !isProfilePage)
  ) {
    return (
      <div className={styles.sessionLoading} role="status">
        <span />
        Preparando seu painel...
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <DashboardSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className={styles.content}>
        <DashboardHeader onMenuOpen={() => setMenuOpen(true)} />
        {children}
      </div>
    </div>
  );
}
