"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, ViewTransition } from "react";
import { useAuth } from "@/features/auth";
import { useOrganizations } from "@/features/organizations/context/OrganizationContext";
import { roleLabel } from "@/features/organizations/types/organization.types";
import { usePlantations } from "@/features/plantations/context/PlantationContext";
import { DashboardIcon } from "../dashboard-icons/DashboardIcon";
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

function initialsOf(name: string | undefined) {
  return (
    name
      ?.split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() ?? "TS"
  );
}

function OrganizationSwitcher({ onNavigate }: { onNavigate: () => void }) {
  const { memberships, selected, status, selectOrganization } =
    useOrganizations();
  return (
    <Switcher
      label="ORGANIZAÇÃO"
      listTitle="SUAS ORGANIZAÇÕES"
      emptyName="Selecionar organização"
      current={
        selected && {
          name: selected.organization.name,
          detail: roleLabel(selected.role),
        }
      }
      items={memberships.map((item) => ({
        id: item.organization.id,
        name: item.organization.name,
        detail: roleLabel(item.role),
      }))}
      selectedId={selected?.organization.id}
      onSelect={selectOrganization}
      status={status}
      messages={{
        loading: "Carregando organizações...",
        error:
          "Não foi possível carregar suas organizações. Acesse a equipe para tentar novamente.",
        empty: "Você ainda não participa de uma organização.",
        single: "Você participa apenas desta organização.",
      }}
      manage={{ href: "/dashboard/equipe", label: "Gerenciar organização e equipe" }}
      onNavigate={onNavigate}
    />
  );
}

function PlantationSwitcher({ onNavigate }: { onNavigate: () => void }) {
  const { plantations, selectedPlantation, selectPlantation, status } =
    usePlantations();
  return (
    <Switcher
      label="PROPRIEDADE ATIVA"
      listTitle="SUAS PLANTAÇÕES"
      emptyName="Selecionar plantação"
      current={selectedPlantation && { name: selectedPlantation.name }}
      items={plantations.map((plantation) => ({
        id: plantation.id,
        name: plantation.name,
        detail: roleLabel(plantation.role),
      }))}
      selectedId={selectedPlantation?.id}
      onSelect={selectPlantation}
      status={status}
      messages={{
        loading: "Carregando plantações...",
        error:
          "Não foi possível carregar suas plantações. Acesse o gerenciamento para tentar novamente.",
        empty: "Você ainda não possui uma plantação.",
        single: "Você possui apenas esta plantação.",
      }}
      manage={{ href: "/dashboard/plantacoes", label: "Gerenciar plantações" }}
      onNavigate={onNavigate}
    />
  );
}

type SwitcherProps = {
  label: string;
  listTitle: string;
  emptyName: string;
  current: { name: string; detail?: string } | null | undefined;
  items: { id: string; name: string; detail: string }[];
  selectedId: string | undefined;
  onSelect: (id: string) => void;
  status: string;
  messages: { loading: string; error: string; empty: string; single: string };
  manage: { href: string; label: string };
  onNavigate: () => void;
};

function Switcher({
  label,
  listTitle,
  emptyName,
  current,
  items,
  selectedId,
  onSelect,
  status,
  messages,
  manage,
  onNavigate,
}: SwitcherProps) {
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
        aria-label={`${emptyName}. Atual: ${current?.name ?? "nenhuma"}`}
        onClick={() => setExpanded((value) => !value)}
      >
        <span className={styles.plantationMark}>{initialsOf(current?.name)}</span>
        <span className={styles.plantationLabel}>
          <small>{label}</small>
          <strong>{current?.name ?? emptyName}</strong>
          {current?.detail && <em>{current.detail}</em>}
        </span>
        <DashboardIcon name="chevron" size={16} />
      </button>
      <div
        id={panelId}
        className={styles.plantationDropdown}
        hidden={!expanded}
      >
        <p className={styles.switcherTitle}>{listTitle}</p>
        {status === "loading" || status === "idle" ? (
          <p className={styles.switcherMessage} role="status">
            {messages.loading}
          </p>
        ) : status === "error" ? (
          <p className={styles.switcherMessage} role="alert">
            {messages.error}
          </p>
        ) : items.length === 0 ? (
          <p className={styles.switcherMessage}>{messages.empty}</p>
        ) : (
          <>
            <ul className={styles.plantationOptions}>
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    aria-pressed={selectedId === item.id}
                    onClick={() => {
                      onSelect(item.id);
                      setExpanded(false);
                      trigger.current?.focus();
                    }}
                  >
                    <span>
                      <strong>{item.name}</strong>
                      <small>{item.detail}</small>
                    </span>
                    {selectedId === item.id && (
                      <span className={styles.selectedMark} aria-hidden="true">
                        ✓
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
            {items.length === 1 && (
              <p className={styles.switcherMessage}>{messages.single}</p>
            )}
          </>
        )}
        <Link
          href={manage.href}
          className={styles.managePlantations}
          onClick={() => {
            setExpanded(false);
            onNavigate();
          }}
        >
          {manage.label} <DashboardIcon name="chevron" size={14} />
        </Link>
      </div>
    </div>
  );
}
