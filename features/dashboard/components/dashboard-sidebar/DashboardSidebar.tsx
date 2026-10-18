"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ViewTransition } from "react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { DashboardIcon } from "../dashboard-icons/DashboardIcon";
import { OrganizationSwitcher, PlantationSwitcher } from "./SidebarSwitchers";
import styles from "./DashboardSidebar.module.css";

// Linha verde do item ativo. Tem o mesmo nome em todos os itens: ao trocar de tela ela
// desliza do item antigo até o novo, como a linha da aba no menu do site (globals.css).
function ActiveIndicator() {
  return (
    <ViewTransition name="sidebar-indicator" share="nav-slide" default="none">
      <span className={styles.indicator} aria-hidden="true" />
    </ViewTransition>
  );
}

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
    label: "Alertas",
    icon: "alert",
    href: "/dashboard/alertas",
    badge: undefined,
  },
] as const;

type DashboardSidebarProps = {
  open: boolean;
  onClose: () => void;
};

export function DashboardSidebar({ open, onClose }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const isAdmin = user?.systemRole === "SUPERADMIN";
  const initials =
    user?.name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() ?? "TS";

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
          <div className={styles.switchers}>
            <OrganizationSwitcher
              key={`organization:${pathname}:${open}`}
              onNavigate={onClose}
            />
            <PlantationSwitcher
              key={`plantation:${pathname}:${open}`}
              onNavigate={onClose}
            />
          </div>
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
                  {isActive && <ActiveIndicator />}
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
              {pathname.startsWith("/dashboard/admin") && <ActiveIndicator />}
              <DashboardIcon name="team" />
              <span>Superadmin</span>
            </Link>
          )}
          {!isAdmin && (
            <>
              <Link
                href="/dashboard/equipe"
                className={
                  pathname.startsWith("/dashboard/equipe") ? styles.active : ""
                }
                onClick={onClose}
              >
                {pathname.startsWith("/dashboard/equipe") && <ActiveIndicator />}
                <DashboardIcon name="team" />
                <span>Equipe</span>
              </Link>
              <Link
                className={
                  pathname.startsWith("/dashboard/configuracoes")
                    ? styles.active
                    : ""
                }
                href="/dashboard/configuracoes/alertas"
                onClick={onClose}
              >
                {pathname.startsWith("/dashboard/configuracoes") && <ActiveIndicator />}
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

        <Link
          className={`${styles.profile} ${pathname === "/dashboard/perfil" ? styles.profileActive : ""}`}
          href="/dashboard/perfil"
          onClick={onClose}
          aria-label="Abrir meu perfil"
          aria-current={pathname === "/dashboard/perfil" ? "page" : undefined}
          title="Meu perfil"
        >
          <span>{initials}</span>
          <div>
            <strong>{user?.name}</strong>
            <small>{user?.email}</small>
          </div>
          <DashboardIcon name="chevron" size={16} />
        </Link>
      </aside>
    </>
  );
}
