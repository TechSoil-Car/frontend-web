"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardIcon } from "@/features/dashboard/components/dashboard-icons/DashboardIcon";
import { useOrganizations } from "@/features/organizations/context/OrganizationContext";
import { errorMessage } from "@/shared/api/error-message";
import { EmptyState, LoadingState } from "@/shared/components/empty-state/EmptyState";
import { usePlantations } from "../../context/PlantationContext";
import { plantationFilters, usePlantationList } from "../../hooks/use-plantation-list";
import type { Plantation } from "../../types/plantation.types";
import { CreatePlantationDialog } from "./CreatePlantationDialog";
import { PlantationCard } from "./PlantationCard";
import { PlantationDetails } from "./PlantationDetails";
import { PlantationMaintenanceDialog } from "./PlantationMaintenanceDialog";
import { PlantationsSummary } from "./PlantationsSummary";
import styles from "./PlantationsScreen.module.css";

export function PlantationsScreen() {
  const router = useRouter();
  const { selected: organization, status: organizationsStatus } = useOrganizations();
  const canCreate = organizationsStatus === "ready" && organization?.role === "OWNER";
  const {
    plantations,
    selectedPlantation,
    status,
    selectPlantation,
    createPlantation,
    reloadPlantations,
  } = usePlantations();
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [maintenance, setMaintenance] = useState<{
    plantation: Plantation;
    action: "edit" | "remove";
  } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const {
    query,
    setQuery,
    filter,
    setFilter,
    visiblePlantations,
    ownerCount,
    sharedCount,
    locationCount,
  } = usePlantationList(plantations);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canCreate || !organization) return;
    const formElement = event.currentTarget;
    setCreating(true);
    setCreateError(null);
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const location = String(form.get("location") ?? "").trim();

    try {
      await createPlantation({ name, organizationId: organization.organization.id, ...(location ? { location } : {}) });
      setCreateOpen(false);
      formElement.reset();
    } catch (error) {
      setCreateError(
        errorMessage(
          error,
          "Não foi possível criar a plantação. Tente novamente.",
        ),
      );
    } finally {
      setCreating(false);
    }
  }

  if (status === "loading" || status === "idle") {
    return (
      <main className={styles.page}>
        <LoadingState
          title="Carregando suas plantações"
          text="Buscando propriedades e permissões atualizadas..."
        />
      </main>
    );
  }

  if (status === "error") {
    return (
      <main className={styles.statePage}>
        <span className={styles.stateIcon}>
          <DashboardIcon name="alert" />
        </span>
        <strong>Não foi possível carregar as plantações</strong>
        <p>Confira se o Backend Web está em execução e tente novamente.</p>
        <button type="button" onClick={() => void reloadPlantations()}>
          Tentar novamente
        </button>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.heading}>
        <div>
          <p>GESTÃO DA PROPRIEDADE</p>
          <h1>Suas plantações</h1>
          <span>
            Escolha a área de trabalho ou cadastre uma nova propriedade.
          </span>
        </div>
        <button
          className={styles.addButton}
          disabled={!canCreate}
          type="button"
          onClick={() => {
            setCreateError(null);
            setCreateOpen(true);
          }}
        >
          <b>+</b> Nova plantação
        </button>
      </section>

      <p>Organização: {organization?.organization.name ?? "nenhuma selecionada"}. <Link href="/dashboard/equipe">Gerenciar organizações e equipe</Link></p>
      {!canCreate && <p>Para criar plantações, selecione uma organização da qual você seja proprietário ou crie uma organização.</p>}

      {notice && (
        <p className={styles.notice} role="status">
          {notice}
        </p>
      )}

      <PlantationsSummary
        total={plantations.length}
        ownerCount={ownerCount}
        sharedCount={sharedCount}
        locationCount={locationCount}
      />

      {plantations.length === 0 ? (
        <section className={styles.firstPlantation}>
          <span>
            <DashboardIcon name="field" size={27} />
          </span>
          <p>PRIMEIROS PASSOS</p>
          <h2>Cadastre sua primeira plantação</h2>
          <small>
            Ela será o espaço central para organizar sensores, carrinhos,
            fileiras e missões.
          </small>
          <button
            className={styles.addButton}
            disabled={!canCreate}
            type="button"
            onClick={() => setCreateOpen(true)}
          >
            <b>+</b> Criar plantação
          </button>
        </section>
      ) : (
        <>
          <section
            className={styles.toolbar}
            aria-label="Filtros das plantações"
          >
            <div className={styles.search}>
              <DashboardIcon name="search" size={18} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por nome ou localização..."
                aria-label="Buscar plantações"
              />
            </div>
            <div className={styles.filters}>
              {plantationFilters.map((item) => (
                <button
                  className={filter === item.value ? styles.filterActive : ""}
                  type="button"
                  key={item.value}
                  onClick={() => setFilter(item.value)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </section>

          <div className={styles.contentGrid}>
            <section className={styles.list} aria-label="Lista de plantações">
              <div className={styles.listHeader}>
                <span>
                  {visiblePlantations.length}{" "}
                  {visiblePlantations.length === 1
                    ? "propriedade encontrada"
                    : "propriedades encontradas"}
                </span>
                <small>Dados sincronizados com sua conta</small>
              </div>
              {visiblePlantations.length ? (
                visiblePlantations.map((plantation) => (
                  <PlantationCard
                    key={plantation.id}
                    plantation={plantation}
                    selected={selectedPlantation?.id === plantation.id}
                    onSelect={() => selectPlantation(plantation.id)}
                  />
                ))
              ) : (
                <EmptyState
                  art="search"
                  variant="plain"
                  title="Nenhuma plantação encontrada"
                  text="Tente outro nome ou remova os filtros."
                />
              )}
            </section>

            {selectedPlantation && (
              <PlantationDetails
                plantation={selectedPlantation}
                onOpen={() => router.push("/dashboard")}
                onMaintenance={(action) => {
                  setNotice(null);
                  setMaintenance({ plantation: selectedPlantation, action });
                }}
              />
            )}
          </div>
        </>
      )}

      {maintenance &&
        plantations.some(
          (item) =>
            item.id === maintenance.plantation.id && item.role === "OWNER",
        ) && (
          <PlantationMaintenanceDialog
            key={`${maintenance.plantation.id}:${maintenance.action}`}
            {...maintenance}
            onClose={() => setMaintenance(null)}
            onSuccess={(message) => {
              setMaintenance(null);
              setNotice(message);
            }}
          />
        )}
      {createOpen && canCreate && (
        <CreatePlantationDialog
          creating={creating}
          error={createError}
          onClose={() => setCreateOpen(false)}
          onSubmit={handleCreate}
        />
      )}
    </main>
  );
}
