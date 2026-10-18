"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth";
import { usePlantations } from "@/features/plantations/context/PlantationContext";
import { DashboardIcon } from "@/features/dashboard/components/dashboard-icons/DashboardIcon";
import { useSensorMonitoring } from "@/features/sensors/hooks/use-sensor-monitoring";
import { EmptyState, LoadingState } from "@/shared/components/empty-state/EmptyState";
import {
  defaultFilters,
  filterAlerts,
  summarizeAlerts,
  type AlertFilters,
} from "../../utils/alert-view";
import { AlertCard } from "./AlertCard";
import { AlertFiltersBar } from "./AlertFiltersBar";
import { AlertStats } from "./AlertStats";
import styles from "./AlertsScreen.module.css";

export function AlertsScreen() {
  const { user } = useAuth();
  const { selectedPlantation } = usePlantations();
  if (user?.systemRole === "SUPERADMIN")
    return (
      <main className={styles.page}>
        <h1>Acesso operacional restrito</h1>
        <p>O superadmin não possui alertas de plantações.</p>
        <Link href="/dashboard/admin">Voltar à administração</Link>
      </main>
    );
  if (!selectedPlantation)
    return (
      <main className={styles.page}>
        <h1>Alertas</h1>
        <p>Selecione uma plantação para acompanhar os alertas ativos.</p>
        <Link href="/dashboard/plantacoes">Ver plantações</Link>
      </main>
    );
  return (
    <ActiveAlerts
      key={selectedPlantation.id}
      plantationId={selectedPlantation.id}
      name={selectedPlantation.name}
    />
  );
}

function ActiveAlerts({
  plantationId,
  name,
}: {
  plantationId: string;
  name: string;
}) {
  const { sensors, alerts, status, lastUpdatedAt, refreshFailed, reload } =
    useSensorMonitoring(plantationId);
  const [filters, setFilters] = useState<AlertFilters>(defaultFilters);
  const hasSnapshot = lastUpdatedAt !== null;
  const stats = summarizeAlerts(alerts);
  const visible = filterAlerts(alerts, filters);
  const selectedSensor = sensors.some(
    (sensor) => sensor.device.id === filters.sensor,
  )
    ? filters.sensor
    : "all";
  const filteredAlerts =
    selectedSensor === filters.sensor
      ? visible
      : filterAlerts(alerts, { ...filters, sensor: "all" });
  const filtering = Boolean(
    filters.search.trim() ||
    selectedSensor !== "all" ||
    filters.kind !== "all" ||
    filters.severity !== "all",
  );
  const update = <K extends keyof AlertFilters>(
    key: K,
    value: AlertFilters[K],
  ) => setFilters((current) => ({ ...current, [key]: value }));

  return (
    <main className={styles.page}>
      <header className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>MONITORAMENTO DA LAVOURA</p>
          <h1>Alertas ativos</h1>
          <p>
            O que precisa de atenção em <strong>{name}</strong>, com base nas
            regras da plantação.
          </p>
        </div>
        <div className={styles.headerActions}>
          <Link href="/dashboard/notificacoes">Histórico de notificações</Link>
          <Link href="/dashboard/configuracoes/alertas">
            Configurar alertas
          </Link>
        </div>
      </header>
      <AlertStats
        stats={stats}
        sensorCount={sensors.length}
        hasSnapshot={hasSnapshot}
      />
      <div className={styles.live}>
        <span>
          <i aria-hidden="true" />
          Atualização automática a cada 1 minuto
          {lastUpdatedAt && (
            <> · Última consulta: {lastUpdatedAt.toLocaleTimeString("pt-BR")}</>
          )}
        </span>
        <button
          type="button"
          disabled={status === "loading"}
          onClick={() => void reload()}
        >
          <DashboardIcon name="refresh" size={15} />
          {status === "loading" ? "Atualizando..." : "Atualizar agora"}
        </button>
      </div>
      {refreshFailed && (
        <div className={styles.error} role="alert">
          <strong>Não foi possível atualizar os alertas.</strong>
          <p>
            {hasSnapshot
              ? "Exibindo a última consulta disponível. Estes dados podem estar desatualizados."
              : "Verifique sua conexão e tente novamente. Não foi possível determinar o estado dos sensores."}
          </p>
          <button
            type="button"
            disabled={status === "loading"}
            onClick={() => void reload()}
          >
            Tentar novamente
          </button>
        </div>
      )}
      {!hasSnapshot ? (
        !refreshFailed && (
          <LoadingState
            variant="card"
            title="Consultando alertas"
            text="Buscando as leituras e regras da sua plantação..."
          />
        )
      ) : (
        <>
          <AlertFiltersBar
            filters={filters}
            selectedSensor={selectedSensor}
            sensors={sensors}
            onChange={update}
          />
          <div className={styles.resultHead}>
            <span role="status">
              {filteredAlerts.length}{" "}
              {filteredAlerts.length === 1
                ? "alerta encontrado"
                : "alertas encontrados"}
              {filtering ? ` de ${stats.total}` : ""}
            </span>
            {filtering && (
              <button type="button" onClick={() => setFilters(defaultFilters)}>
                Limpar filtros
              </button>
            )}
          </div>
          {filteredAlerts.length ? (
            <section className={styles.list} aria-label="Alertas encontrados">
              {filteredAlerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </section>
          ) : (
            <EmptyState
              art={!sensors.length ? "sensor" : filtering ? "search" : "clear"}
              title={
                !sensors.length
                  ? "Nenhum sensor cadastrado"
                  : filtering
                    ? "Nenhum alerta para estes filtros"
                    : "Nenhum alerta ativo"
              }
              text={
                !sensors.length
                  ? "Cadastre um sensor para iniciar o monitoramento desta plantação."
                  : filtering
                    ? "Experimente outro sensor, tipo ou gravidade, ou limpe a busca."
                    : "Nenhuma condição de alerta está sendo detectada pelas regras habilitadas."
              }
            >
              {!sensors.length && (
                <Link href="/dashboard/sensores">Ir para sensores</Link>
              )}
              {filtering && (
                <button
                  type="button"
                  onClick={() => setFilters(defaultFilters)}
                >
                  Limpar filtros
                </button>
              )}
            </EmptyState>
          )}
        </>
      )}
      <p className={styles.note}>
        <DashboardIcon name="alert" size={16} />
        Os alertas refletem as regras habilitadas. Eles desaparecem quando a
        condição deixa de ser detectada ou a regra é desativada. Marcar uma
        notificação como lida não resolve o alerta.
      </p>
    </main>
  );
}
