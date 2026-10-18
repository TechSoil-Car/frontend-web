"use client";

import type { ReactNode } from "react";
import { useEffect, useState, ViewTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/context/AuthContext";
import { usePlantations } from "@/features/plantations/context/PlantationContext";
import { DashboardHeader } from "../dashboard-header/DashboardHeader";
import { DashboardSidebar } from "../dashboard-sidebar/DashboardSidebar";
import styles from "./DashboardLayout.module.css";
import { LoadingState } from "@/shared/components/empty-state/EmptyState";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { status: authStatus, user, retry, logout } = useAuth();
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

  if (authStatus === "unavailable") {
    return (
      <div className={styles.sessionUnavailable} role="alert">
        <strong>Servidor indisponível</strong>
        <p>Não foi possível confirmar sua sessão agora. Seus dados continuam seguros; tente novamente em instantes.</p>
        <div>
          <button type="button" onClick={retry}>Tentar novamente</button>
          <button type="button" onClick={() => void logout()}>Sair da conta</button>
        </div>
      </div>
    );
  }

  if (
    authStatus !== "authenticated" ||
    (isAdmin && !isAdminPage && !isProfilePage) ||
    (!isAdmin &&
      plantationsStatus === "loading" &&
      pathname !== "/dashboard/plantacoes" &&
      !isAdminPage &&
      pathname !== "/dashboard/equipe" &&
      !isProfilePage)
  ) {
    return (
      <div className={styles.sessionLoading}>
        <LoadingState title="Preparando seu painel..." />
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <DashboardSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className={styles.content}>
        <DashboardHeader onMenuOpen={() => setMenuOpen(true)} />
        {/* Troca de tela com a mesma transição do site; barra lateral e cabeçalho ficam parados */}
        <ViewTransition key={pathname} enter="page-enter" exit="page-exit" default="none">
          {children}
        </ViewTransition>
      </div>
    </div>
  );
}
