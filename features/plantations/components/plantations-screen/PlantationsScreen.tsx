"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { DashboardIcon } from "@/features/dashboard/components/dashboard-icons/DashboardIcon";
import { ApiError } from "@/shared/api/api-client";
import { usePlantations } from "../../context/PlantationContext";
import type { Plantation, PlantationRole } from "../../types/plantation.types";
import { PlantationMaintenanceDialog } from "./PlantationMaintenanceDialog";
import styles from "./PlantationsScreen.module.css";

type PlantationFilter = "all" | PlantationRole;

const filters: Array<{ label: string; value: PlantationFilter }> = [
  { label: "Todas", value: "all" },
  { label: "Administradas por mim", value: "OWNER" },
  { label: "Compartilhadas", value: "MEMBER" },
];

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function PlantationsScreen() {
  const router = useRouter();
  const {
    plantations,
    selectedPlantation,
    status,
    selectPlantation,
    createPlantation,
    reloadPlantations,
  } = usePlantations();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<PlantationFilter>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [maintenance, setMaintenance] = useState<{
    plantation: Plantation;
    action: "edit" | "remove";
  } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const visiblePlantations = useMemo(
    () =>
      plantations.filter((plantation) => {
        const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
        const searchable =
          `${plantation.name} ${plantation.location ?? ""}`.toLocaleLowerCase(
            "pt-BR",
          );
        return (
          (filter === "all" || plantation.role === filter) &&
          (!normalizedQuery || searchable.includes(normalizedQuery))
        );
      }),
    [filter, plantations, query],
  );

  const ownerCount = plantations.filter(
    (plantation) => plantation.role === "OWNER",
  ).length;
  const sharedCount = plantations.length - ownerCount;
  const locationCount = new Set(
    plantations.map((plantation) => plantation.location).filter(Boolean),
  ).size;

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setCreating(true);
    setCreateError(null);
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const location = String(form.get("location") ?? "").trim();

    try {
      await createPlantation({ name, ...(location ? { location } : {}) });
      setCreateOpen(false);
      formElement.reset();
    } catch (error) {
      setCreateError(
        error instanceof ApiError
          ? error.message
          : "Não foi possível criar a plantação. Tente novamente.",
      );
    } finally {
      setCreating(false);
    }
  }

  if (status === "loading" || status === "idle") {
    return (
      <main className={styles.statePage} role="status">
        <span className={styles.spinner} />
        <strong>Carregando suas plantações</strong>
        <p>Buscando propriedades e permissões atualizadas...</p>
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
          type="button"
          onClick={() => {
            setCreateError(null);
            setCreateOpen(true);
          }}
        >
          <b>+</b> Nova plantação
        </button>
      </section>

      {notice && (
        <p className={styles.notice} role="status">
          {notice}
        </p>
      )}

      <section className={styles.summary} aria-label="Resumo das plantações">
        <article>
          <span className={styles.summaryIcon}>
            <DashboardIcon name="field" />
          </span>
          <div>
            <small>PROPRIEDADES</small>
            <strong>{plantations.length}</strong>
            <p>vinculadas à sua conta</p>
          </div>
        </article>
        <article>
          <span className={styles.summaryIcon}>
            <DashboardIcon name="settings" />
          </span>
          <div>
            <small>SOB MINHA GESTÃO</small>
            <strong>{ownerCount}</strong>
            <p>acesso como proprietário</p>
          </div>
        </article>
        <article>
          <span className={styles.summaryIcon}>
            <DashboardIcon name="team" />
          </span>
          <div>
            <small>COMPARTILHADAS</small>
            <strong>{sharedCount}</strong>
            <p>acesso como membro</p>
          </div>
        </article>
        <article>
          <span className={styles.summaryIcon}>
            <DashboardIcon name="location" />
          </span>
          <div>
            <small>LOCALIZAÇÕES</small>
            <strong>{locationCount}</strong>
            <p>locais informados</p>
          </div>
        </article>
      </section>

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
              {filters.map((item) => (
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
                visiblePlantations.map((plantation, index) => (
                  <button
                    className={`${styles.plantationCard} ${selectedPlantation?.id === plantation.id ? styles.cardSelected : ""}`}
                    type="button"
                    key={plantation.id}
                    onClick={() => selectPlantation(plantation.id)}
                  >
                    <span className={styles.cardImage}>
                      <Image
                        src={
                          index % 2 === 0
                            ? "/vineyard-sectors.png"
                            : "/hero-vineyard.png"
                        }
                        alt=""
                        fill
                        sizes="180px"
                      />
                      <i
                        className={
                          plantation.role === "OWNER"
                            ? styles.owner
                            : styles.member
                        }
                      >
                        <b />
                        {plantation.role === "OWNER"
                          ? "Proprietário"
                          : "Membro"}
                      </i>
                    </span>
                    <span className={styles.cardContent}>
                      <span className={styles.cardTitle}>
                        <span>
                          <strong>{plantation.name}</strong>
                          <small>
                            {plantation.location || "Localização não informada"}
                          </small>
                        </span>
                        <DashboardIcon name="chevron" size={17} />
                      </span>
                      <span className={styles.cardMeta}>
                        <span>
                          <small>CADASTRADA EM</small>
                          <strong>{formatDate(plantation.createdAt)}</strong>
                        </span>
                        <span>
                          <small>SEU ACESSO</small>
                          <strong>
                            {plantation.role === "OWNER"
                              ? "Gestão completa"
                              : "Monitoramento"}
                          </strong>
                        </span>
                      </span>
                      <span className={styles.selectionState}>
                        {selectedPlantation?.id === plantation.id ? (
                          <>
                            <i /> Plantação ativa no painel
                          </>
                        ) : (
                          "Selecionar esta propriedade"
                        )}
                      </span>
                    </span>
                  </button>
                ))
              ) : (
                <div className={styles.empty}>
                  <DashboardIcon name="search" size={24} />
                  <strong>Nenhuma plantação encontrada</strong>
                  <p>Tente outro nome ou remova os filtros.</p>
                </div>
              )}
            </section>

            {selectedPlantation && (
              <aside
                className={styles.details}
                aria-label={`Resumo de ${selectedPlantation.name}`}
              >
                <div className={styles.detailHero}>
                  <Image
                    src="/vineyard-sectors.png"
                    alt=""
                    fill
                    sizes="380px"
                  />
                  <div />
                  <span className={styles.detailStatus}>
                    <i /> Selecionada
                  </span>
                  <span className={styles.detailIdentity}>
                    <b>{initials(selectedPlantation.name)}</b>
                    <span>
                      <strong>{selectedPlantation.name}</strong>
                      <small>
                        {selectedPlantation.location ||
                          "Localização não informada"}
                      </small>
                    </span>
                  </span>
                </div>
                <div className={styles.detailBody}>
                  <p className={styles.detailKicker}>ÁREA DE TRABALHO ATIVA</p>
                  <h2>Pronta para monitoramento</h2>
                  <p className={styles.detailCopy}>
                    Sensores, alertas e missões do painel serão associados a
                    esta plantação.
                  </p>
                  <div className={styles.detailMetrics}>
                    <article>
                      <small>Nível de acesso</small>
                      <strong>
                        {selectedPlantation.role === "OWNER"
                          ? "Proprietário"
                          : "Membro"}
                      </strong>
                      <span>
                        {selectedPlantation.role === "OWNER"
                          ? "Pode gerenciar recursos"
                          : "Pode acompanhar a operação"}
                      </span>
                    </article>
                    <article>
                      <small>Data de cadastro</small>
                      <strong>
                        {formatDate(selectedPlantation.createdAt)}
                      </strong>
                      <span>Registro sincronizado</span>
                    </article>
                  </div>
                  <button
                    className={styles.openButton}
                    type="button"
                    onClick={() => router.push("/dashboard")}
                  >
                    Abrir painel <DashboardIcon name="arrow" size={17} />
                  </button>
                  {selectedPlantation.role === "OWNER" && (
                    <>
                      <button
                        className={styles.secondaryButton}
                        type="button"
                        onClick={() => {
                          setNotice(null);
                          setMaintenance({
                            plantation: selectedPlantation,
                            action: "edit",
                          });
                        }}
                      >
                        <DashboardIcon name="settings" size={16} /> Editar
                        plantação
                      </button>
                      <button
                        className={styles.secondaryButton}
                        type="button"
                        onClick={() => router.push("/dashboard/mapa")}
                      >
                        Editar área no mapa
                      </button>
                      <button
                        className={styles.removeButton}
                        type="button"
                        onClick={() => {
                          setNotice(null);
                          setMaintenance({
                            plantation: selectedPlantation,
                            action: "remove",
                          });
                        }}
                      >
                        <DashboardIcon name="trash" size={16} /> Remover
                        plantação
                      </button>
                    </>
                  )}
                </div>
              </aside>
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
      {createOpen && (
        <div className={styles.modalLayer} role="presentation">
          <button
            className={styles.modalBackdrop}
            type="button"
            aria-label="Fechar cadastro"
            onClick={() => !creating && setCreateOpen(false)}
          />
          <section
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-plantation-title"
          >
            <div className={styles.modalHead}>
              <span>
                <DashboardIcon name="field" />
              </span>
              <div>
                <p>NOVA PROPRIEDADE</p>
                <h2 id="new-plantation-title">Cadastrar plantação</h2>
              </div>
              <button
                type="button"
                aria-label="Fechar"
                onClick={() => setCreateOpen(false)}
                disabled={creating}
              >
                ×
              </button>
            </div>
            <p className={styles.modalIntro}>
              Comece pelo essencial. Depois você poderá adicionar dispositivos,
              fileiras e membros.
            </p>
            <form className={styles.createForm} onSubmit={handleCreate}>
              <label htmlFor="plantation-name">Nome da plantação</label>
              <input
                id="plantation-name"
                name="name"
                minLength={2}
                maxLength={120}
                placeholder="Ex.: Fazenda Santa Clara"
                autoFocus
                disabled={creating}
                required
              />
              <label htmlFor="plantation-location">
                Localização <span>opcional</span>
              </label>
              <input
                id="plantation-location"
                name="location"
                maxLength={240}
                placeholder="Ex.: Londrina, Paraná"
                disabled={creating}
              />
              {createError && (
                <p className={styles.formError} role="alert">
                  {createError}
                </p>
              )}
              <div className={styles.formActions}>
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  disabled={creating}
                >
                  Cancelar
                </button>
                <button type="submit" disabled={creating}>
                  {creating ? "Criando..." : "Criar plantação"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
