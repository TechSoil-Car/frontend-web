"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { useOrganizations } from "@/features/organizations/context/OrganizationContext";
import { roleLabel } from "@/features/organizations/types/organization.types";
import { usePlantations } from "@/features/plantations/context/PlantationContext";
import { DashboardIcon } from "../dashboard-icons/DashboardIcon";
import styles from "./DashboardSidebar.module.css";

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

export function OrganizationSwitcher({ onNavigate }: { onNavigate: () => void }) {
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

export function PlantationSwitcher({ onNavigate }: { onNavigate: () => void }) {
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
