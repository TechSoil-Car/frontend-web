"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePlantations } from "@/features/plantations/context/PlantationContext";
import { BackLink } from "@/shared/components/back-link/BackLink";
import { useNotifications } from "../../hooks/use-notifications";
import { NotificationCard } from "../notification-card/NotificationCard";
import { EmailPreference } from "./EmailPreference";
import styles from "../Notifications.module.css";
import { EmptyState, LoadingState } from "@/shared/components/empty-state/EmptyState";

export function NotificationsScreen({
  initialPlantationId,
}: {
  initialPlantationId?: string;
}) {
  const { selectedPlantation, plantations, status, selectPlantation } =
    usePlantations();
  const applied = useRef<string | null>(null);
  useEffect(() => {
    if (
      !initialPlantationId ||
      status !== "ready" ||
      applied.current === initialPlantationId
    )
      return;
    applied.current = initialPlantationId;
    if (plantations.some((item) => item.id === initialPlantationId))
      selectPlantation(initialPlantationId);
  }, [initialPlantationId, status, plantations, selectPlantation]);
  if (!selectedPlantation)
    return (
      <main className={styles.page}>
        <h1>Notificações</h1>
        <p>Selecione uma plantação para consultar o histórico.</p>
      </main>
    );
  return (
    <History
      key={selectedPlantation.id}
      plantationId={selectedPlantation.id}
      name={selectedPlantation.name}
    />
  );
}

function History({
  plantationId,
  name,
}: {
  plantationId: string;
  name: string;
}) {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const { data, error, busy, reload, markRead } = useNotifications(
    plantationId,
    page,
    filter,
  );
  return (
    <main className={styles.page}>
      <BackLink href="/dashboard/alertas">Voltar para alertas</BackLink>
      <header className={styles.heading}>
        <div>
          <small>CENTRAL DE NOTIFICAÇÕES</small>
          <h1>Histórico de alertas</h1>
          <p>
            Acompanhe as ocorrências de {name}. Sua marcação como lido é
            individual.
          </p>
        </div>
        <button type="button" disabled={busy} onClick={() => void reload()}>
          Atualizar
        </button>
      </header>
      <EmailPreference />
      <section
        className={styles.history}
        aria-label="Histórico pessoal de notificações"
      >
        <div className={styles.toolbar}>
          <div className={styles.filters}>
            {(["all", "unread"] as const).map((value) => (
              <button
                type="button"
                key={value}
                aria-pressed={filter === value}
                disabled={busy}
                onClick={() => {
                  setFilter(value);
                  setPage(1);
                }}
              >
                {value === "all"
                  ? "Todas"
                  : `Não lidas${data ? ` (${data.unread})` : ""}`}
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={busy || !data?.unread}
            onClick={async () => {
              if (await markRead()) setPage(1);
            }}
          >
            Marcar todas como lidas
          </button>
        </div>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        {!data && !error && <LoadingState variant="inline" title="Carregando notificações..." />}
        {data && !data.data.length && (
          <EmptyState
            art="bell"
            variant="plain"
            title={
              filter === "unread"
                ? "Nenhuma notificação não lida"
                : "Nenhuma ocorrência registrada"
            }
            text="O histórico começa com a ativação desta funcionalidade. A coleta ocorre em segundo plano, aproximadamente a cada minuto."
          />
        )}
        {data?.data.map((item) => (
          <NotificationCard
            key={item.id}
            item={item}
            busy={busy}
            onRead={async () => {
              if (await markRead(item.id)) setPage(1);
            }}
          />
        ))}
        <footer className={styles.pagination}>
          <button
            type="button"
            disabled={busy || page === 1}
            onClick={() => setPage((value) => value - 1)}
          >
            Anterior
          </button>
          <span>
            Página {page}
            {data ? ` · ${data.total} registros` : ""}
          </span>
          <button
            type="button"
            disabled={busy || !data || page * data.pageSize >= data.total}
            onClick={() => setPage((value) => value + 1)}
          >
            Próxima
          </button>
        </footer>
      </section>
      <p className={styles.note}>
        Ler uma notificação não resolve o problema do sensor. “Encerrado” indica
        que a condição deixou de ser detectada, a regra foi desativada ou o
        sensor foi removido.{" "}
        <Link href="/dashboard/alertas">Consultar alertas atuais</Link>
      </p>
    </main>
  );
}
