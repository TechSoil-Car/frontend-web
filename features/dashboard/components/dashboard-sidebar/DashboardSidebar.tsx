"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
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
          <PlantationSwitcher
            key={`${pathname}:${open}`}
            onNavigate={onClose}
          />
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
              <Link
                href="/dashboard/equipe"
                className={
                  pathname.startsWith("/dashboard/equipe") ? styles.active : ""
                }
                onClick={onClose}
              >
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

function PlantationSwitcher({ onNavigate }: { onNavigate: () => void }) {
  const { plantations, selectedPlantation, selectPlantation, status } =
    usePlantations();
  const [expanded, setExpanded] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!expanded) return;
    function outside(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !container.current?.contains(event.target)
      )
        setExpanded(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setExpanded(false);
        trigger.current?.focus();
      }
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [expanded]);

  return (
    <div
      className={styles.plantationSwitcher}
      ref={container}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setExpanded(false);
      }}
    >
      <button
        ref={trigger}
        type="button"
        className={styles.plantation}
        aria-expanded={expanded}
        aria-controls={panelId}
        aria-label={`Selecionar plantação. Atual: ${selectedPlantation?.name ?? "nenhuma"}`}
        onClick={() => setExpanded((value) => !value)}
      >
        <span className={styles.plantationMark}>
          {selectedPlantation?.name
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part[0])
            .join("")
            .toUpperCase() ?? "TS"}
        </span>
        <span className={styles.plantationLabel}>
          <small>PROPRIEDADE ATIVA</small>
          <strong>{selectedPlantation?.name ?? "Selecionar plantação"}</strong>
        </span>
        <DashboardIcon name="chevron" size={16} />
      </button>
      <div
        id={panelId}
        className={styles.plantationDropdown}
        hidden={!expanded}
      >
        <p className={styles.switcherTitle}>SUAS PLANTAÇÕES</p>
        {status === "loading" || status === "idle" ? (
          <p className={styles.switcherMessage} role="status">
            Carregando plantações...
          </p>
        ) : status === "error" ? (
          <p className={styles.switcherMessage} role="alert">
            Não foi possível carregar suas plantações. Acesse o gerenciamento
            para tentar novamente.
          </p>
        ) : plantations.length === 0 ? (
          <p className={styles.switcherMessage}>
            Você ainda não possui uma plantação.
          </p>
        ) : (
          <>
            <ul className={styles.plantationOptions}>
              {plantations.map((plantation) => (
                <li key={plantation.id}>
                  <button
                    type="button"
                    aria-pressed={selectedPlantation?.id === plantation.id}
                    onClick={() => {
                      selectPlantation(plantation.id);
                      setExpanded(false);
                      trigger.current?.focus();
                    }}
                  >
                    <span>
                      <strong>{plantation.name}</strong>
                      <small>
                        {plantation.role === "OWNER"
                          ? "Proprietário"
                          : "Membro"}
                      </small>
                    </span>
                    {selectedPlantation?.id === plantation.id && (
                      <span className={styles.selectedMark} aria-hidden="true">
                        ✓
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
            {plantations.length === 1 && (
              <p className={styles.switcherMessage}>
                Você possui apenas esta plantação.
              </p>
            )}
          </>
        )}
        <Link
          href="/dashboard/plantacoes"
          className={styles.managePlantations}
          onClick={() => {
            setExpanded(false);
            onNavigate();
          }}
        >
          Gerenciar plantações <DashboardIcon name="chevron" size={14} />
        </Link>
      </div>
    </div>
  );
}
