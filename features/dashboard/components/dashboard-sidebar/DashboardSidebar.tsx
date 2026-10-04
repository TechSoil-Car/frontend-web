"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/features/auth";
import { usePlantations } from "@/features/plantations/context/PlantationContext";
import { DashboardIcon } from "../dashboard-icons/DashboardIcon";
import styles from "./DashboardSidebar.module.css";

const navigation = [
  {
    label: "Visão geral",
    icon: "overview",
    href: "/dashboard",
    badge: undefined,
  },
  {
    label: "Plantações",
    icon: "field",
    href: "/dashboard/plantacoes",
    badge: undefined,
  },
  {
    label: "Mapa da lavoura",
    icon: "map",
    href: "/dashboard/mapa",
    badge: undefined,
  },
  {
    label: "Sensores",
    icon: "sensor",
    href: "/dashboard/sensores",
    badge: undefined,
  },
  {
    label: "Missões",
    icon: "mission",
    href: "/dashboard#atividade",
    badge: undefined,
  },
  {
    label: "Alertas",
    icon: "alert",
    href: "/dashboard#alertas",
    badge: undefined,
  },
] as const;

type DashboardSidebarProps = {
  open: boolean;
  onClose: () => void;
};

export function DashboardSidebar({ open, onClose }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const isAdmin = user?.systemRole === "SUPERADMIN";
  const { selectedPlantation } = usePlantations();
  const initials =
    user?.name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() ?? "TS";

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <>
      <button
        className={`${styles.backdrop} ${open ? styles.backdropVisible : ""}`}
        type="button"
        aria-label="Fechar menu"
        onClick={onClose}
      />
      <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`}>
        <div className={styles.brand}>
          <span className={styles.logo}>
            <Image
              src="/techsoil-mark.png"
              alt=""
              width={140}
              height={140}
              priority
            />
          </span>
          <span>
            <strong>TECHSOIL</strong>
            <small>SYSTEMS</small>
          </span>
        </div>

        {!isAdmin && (
          <Link
            className={styles.plantation}
            href="/dashboard/plantacoes"
            onClick={onClose}
          >
            <span className={styles.plantationMark}>
              {selectedPlantation
                ? selectedPlantation.name
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join("")
                    .toUpperCase()
                : "TS"}
            </span>
            <span>
              <small>PROPRIEDADE ATIVA</small>
              <strong>
                {selectedPlantation?.name ?? "Selecionar plantação"}
              </strong>
            </span>
            <DashboardIcon name="chevron" size={16} />
          </Link>
        )}

        {!isAdmin && (
          <nav className={styles.navigation} aria-label="Navegação do painel">
            <p>MONITORAMENTO</p>
            {navigation.map((item) => {
              const isActive =
                item.href === "/dashboard"
                  ? pathname === item.href
                  : pathname.startsWith(item.href);

              return (
                <Link
                  className={isActive ? styles.active : ""}
                  href={item.href}
                  key={item.label}
                  onClick={onClose}
                >
                  <DashboardIcon name={item.icon} />
                  <span>{item.label}</span>
                  {item.badge && <b>{item.badge}</b>}
                </Link>
              );
            })}
          </nav>
        )}

        <nav className={styles.navigation} aria-label="Configurações">
          <p>GESTÃO</p>
          {user?.systemRole === "SUPERADMIN" && (
            <Link
              className={
                pathname.startsWith("/dashboard/admin") ? styles.active : ""
              }
              href="/dashboard/admin"
              onClick={onClose}
            >
              <DashboardIcon name="team" />
              <span>Superadmin</span>
            </Link>
          )}
          {!isAdmin && (
            <>
              <a href="/dashboard#equipe" onClick={onClose}>
                <DashboardIcon name="team" />
                <span>Equipe</span>
              </a>
              <Link
                className={
                  pathname.startsWith("/dashboard/configuracoes")
                    ? styles.active
                    : ""
                }
                href="/dashboard/configuracoes/alertas"
                onClick={onClose}
              >
                <DashboardIcon name="settings" />
                <span>Configurações</span>
              </Link>
            </>
          )}
        </nav>

        <div className={styles.supportCard}>
          <span>?</span>
          <strong>Precisa de ajuda?</strong>
          <p>Nossa equipe está por perto.</p>
          <a href="mailto:contato@techsoil.com.br">Falar com suporte</a>
        </div>

        <div className={styles.profile}>
          <span>{initials}</span>
          <div>
            <strong>{user?.name}</strong>
            <small>{user?.email}</small>
          </div>
          <button
            type="button"
            aria-label="Sair do painel"
            title="Sair"
            onClick={handleLogout}
          >
            ↪
          </button>
        </div>
      </aside>
    </>
  );
}
