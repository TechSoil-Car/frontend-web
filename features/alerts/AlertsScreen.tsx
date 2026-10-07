"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth";
import { usePlantations } from "@/features/plantations/context/PlantationContext";
import { DashboardIcon } from "@/features/dashboard/components/dashboard-icons/DashboardIcon";
import { useSensorMonitoring } from "@/features/sensors/hooks/use-sensor-monitoring";
import {
  defaultFilters,
  filterAlerts,
  kindLabels,
  recommendations,
  summarizeAlerts,
  type AlertFilters,
} from "./alert-view";
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
      <section
        className={styles.stats}
        aria-label="Resumo de todos os alertas da plantação"
      >
        {(
          [
            {
              label: "Alertas ativos",
              value: stats.total,
              icon: "bell",
              tone: "neutral",
            },
            {
              label: "Críticos",
              value: stats.critical,
              icon: "alert",
              tone: "critical",
            },
            {
              label: "Atenção",
              value: stats.warning,
              icon: "alert",
              tone: "warning",
            },
            {
              label: "Sensores afetados",
              value: stats.affectedSensors,
              icon: "sensor",
              tone: "neutral",
            },
          ] as const
        ).map((item) => (
          <article key={item.label}>
            <span className={`${styles.statIcon} ${styles[item.tone]}`}>
              <DashboardIcon name={item.icon} />
            </span>
            <div>
              <small>{item.label}</small>
              <strong>{hasSnapshot ? item.value : "—"}</strong>
              <small>
                {item.label === "Sensores afetados" && hasSnapshot
                  ? `de ${sensors.length} cadastrados`
                  : "na plantação selecionada"}
              </small>
            </div>
          </article>
        ))}
      </section>
      <div className={styles.live}>
        <span>
          <i aria-hidden="true" />
          Atualização automática a cada 30 segundos
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
          <section className={styles.empty} role="status">
            <DashboardIcon name="sensor" size={28} />
            <h2>Consultando alertas</h2>
            <p>Buscando as leituras e regras da sua plantação...</p>
          </section>
        )
      ) : (
        <>
          <section className={styles.filters} aria-label="Filtrar alertas">
            <label className={styles.search}>
              <DashboardIcon name="search" size={17} />
              <input
                type="search"
                aria-label="Buscar alertas por sensor ou descrição"
                placeholder="Buscar sensor, identificador ou alerta..."
                value={filters.search}
                onChange={(event) => update("search", event.target.value)}
              />
            </label>
            <label className={styles.select}>
              Sensor
              <select
                value={selectedSensor}
                onChange={(event) => update("sensor", event.target.value)}
              >
                <option value="all">Todos os sensores</option>
                {sensors.map((sensor) => (
                  <option key={sensor.device.id} value={sensor.device.id}>
                    {sensor.device.name} · {sensor.device.deviceId}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.select}>
              Tipo de alerta
              <select
                value={filters.kind}
                onChange={(event) =>
                  update("kind", event.target.value as AlertFilters["kind"])
                }
              >
                <option value="all">Todos os tipos</option>
                {Object.entries(kindLabels).map(([value, label]) => (
                  <option value={value} key={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <div
              className={styles.severity}
              role="group"
              aria-label="Gravidade"
            >
              {(["all", "critical", "warning"] as const).map((value) => (
                <button
                  type="button"
                  key={value}
                  aria-pressed={filters.severity === value}
                  onClick={() => update("severity", value)}
                >
                  {value === "all"
                    ? "Todos"
                    : value === "critical"
                      ? "Críticos"
                      : "Atenção"}
                </button>
              ))}
            </div>
          </section>
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
                <article
                  key={alert.id}
                  className={`${styles.card} ${alert.severity === "critical" ? styles.criticalCard : styles.warningCard}`}
                >
                  <div className={styles.cardTop}>
                    <span
                      className={`${styles.badge} ${alert.severity === "critical" ? styles.critical : styles.warning}`}
                    >
                      <DashboardIcon name="alert" size={14} />
                      {alert.severity === "critical" ? "Crítico" : "Atenção"}
                    </span>
                    <small>{kindLabels[alert.kind]}</small>
                  </div>
                  <h2>{alert.title}</h2>
                  <p className={styles.device}>
                    <DashboardIcon name="sensor" size={16} />
                    <strong>{alert.device.name}</strong>
                    <span>{alert.device.deviceId}</span>
                  </p>
                  <p className={styles.message}>{alert.message}</p>
                  <div className={styles.recommendation}>
                    <small>O QUE VERIFICAR</small>
                    <p>{recommendations[alert.kind]}</p>
                  </div>
                  <footer>
                    <span>
                      {alert.occurredAt &&
                      Number.isFinite(Date.parse(alert.occurredAt)) ? (
                        <>
                          Leitura relacionada
                          <br />
                          <time dateTime={alert.occurredAt}>
                            {new Date(alert.occurredAt).toLocaleString("pt-BR")}
                          </time>
                        </>
                      ) : (
                        "Sem leitura recebida"
                      )}
                    </span>
                    <Link href="/dashboard/sensores">
                      Ver sensores <DashboardIcon name="arrow" size={15} />
                    </Link>
                  </footer>
                </article>
              ))}
            </section>
          ) : (
            <section className={styles.empty}>
              <DashboardIcon
                name={sensors.length ? "bell" : "sensor"}
                size={30}
              />
              <h2>
                {!sensors.length
                  ? "Nenhum sensor cadastrado"
                  : filtering
                    ? "Nenhum alerta para estes filtros"
                    : "Nenhum alerta ativo"}
              </h2>
              <p>
                {!sensors.length
                  ? "Cadastre um sensor para iniciar o monitoramento desta plantação."
                  : filtering
                    ? "Experimente outro sensor, tipo ou gravidade, ou limpe a busca."
                    : "Nenhuma condição de alerta está sendo detectada pelas regras habilitadas."}
              </p>
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
            </section>
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
