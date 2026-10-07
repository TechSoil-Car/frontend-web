"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { DashboardIcon } from "@/features/dashboard/components/dashboard-icons/DashboardIcon";
import { usePlantations } from "@/features/plantations/context/PlantationContext";
import { ApiError } from "@/shared/api/api-client";
import { useSensorMonitoring } from "../../hooks/use-sensor-monitoring";
import * as sensorsApi from "../../services/sensors-api";
import type { Device, SensorReading } from "../../types/sensor.types";
import { SensorMaintenanceDialog } from "./SensorMaintenanceDialog";
import {
  formatRelativeTime,
  formatSensorNumber,
  getSensorState,
} from "../../utils/sensor-status";
import styles from "./SensorsScreen.module.css";

type SensorFilter = "all" | "online" | "attention" | "offline";
type SensorTab = "now" | "history" | "alerts";

const filters: Array<{ label: string; value: SensorFilter }> = [
  { label: "Todos", value: "all" },
  { label: "Online", value: "online" },
  { label: "Atenção", value: "attention" },
  { label: "Offline", value: "offline" },
];
const tabs: Array<{ label: string; value: SensorTab }> = [
  { label: "Agora", value: "now" },
  { label: "Histórico", value: "history" },
  { label: "Alertas", value: "alerts" },
];
function chartPoints(readings: SensorReading[]) {
  const ordered = [...readings].reverse();
  if (!ordered.length) return "";
  return ordered
    .map((reading, index) => {
      const x =
        ordered.length === 1 ? 330 : (index / (ordered.length - 1)) * 660;
      const y = 100 - Math.max(0, Math.min(100, reading.moisture));
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export function SensorsScreen() {
  const { selectedPlantation } = usePlantations();
  return (
    <SensorsScreenContent
      key={`${selectedPlantation?.id ?? "none"}:${selectedPlantation?.role ?? "none"}`}
    />
  );
}

function SensorsScreenContent() {
  const { selectedPlantation } = usePlantations();
  const {
    sensors,
    alerts,
    status,
    lastUpdatedAt,
    refreshFailed,
    reload,
    updateDevice,
    removeDevice,
  } = useSensorMonitoring(selectedPlantation?.id);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<SensorFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<SensorTab>("now");
  const [history, setHistory] = useState<SensorReading[]>([]);
  const [historyStatus, setHistoryStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [maintenance, setMaintenance] = useState<{
    device: Device;
    action: "edit" | "remove";
  } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const visibleSensors = useMemo(
    () =>
      sensors.filter((sensor) => {
        const state = getSensorState(sensor, alerts);
        const term = query.trim().toLocaleLowerCase("pt-BR");
        return (
          (filter === "all" || filter === state) &&
          (!term ||
            `${sensor.device.name} ${sensor.device.deviceId}`
              .toLocaleLowerCase("pt-BR")
              .includes(term))
        );
      }),
    [alerts, filter, query, sensors],
  );

  const selected =
    sensors.find((sensor) => sensor.device.id === selectedId) ??
    visibleSensors[0] ??
    sensors[0] ??
    null;
  const selectedAlerts = selected
    ? alerts.filter(
        (alert) => alert.device.deviceId === selected.device.deviceId,
      )
    : [];
  const selectedState = selected ? getSensorState(selected, alerts) : "offline";
  const reading = selected?.reading ?? null;
  const onlineCount = sensors.filter(
    (sensor) => getSensorState(sensor, alerts) !== "offline",
  ).length;
  const attentionCount = sensors.filter(
    (sensor) => getSensorState(sensor, alerts) === "attention",
  ).length;
  const offlineCount = sensors.length - onlineCount;

  useEffect(() => {
    if (tab !== "history" || !selectedPlantation || !selected) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setHistoryStatus("loading");
      sensorsApi
        .getSensorHistory(selectedPlantation.id, selected.device.deviceId, 100)
        .then((response) => {
          if (!cancelled) {
            setHistory(response.data);
            setHistoryStatus("ready");
          }
        })
        .catch(() => {
          if (!cancelled) setHistoryStatus("error");
        });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [selected, selectedPlantation, tab]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedPlantation) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setCreating(true);
    setCreateError(null);
    try {
      await sensorsApi.createSensor(selectedPlantation.id, {
        name: String(data.get("name") ?? "").trim(),
        deviceId: String(data.get("deviceId") ?? "").trim(),
      });
      form.reset();
      setCreateOpen(false);
      await reload();
    } catch (error) {
      setCreateError(
        error instanceof ApiError
          ? error.message
          : "Não foi possível cadastrar o sensor.",
      );
    } finally {
      setCreating(false);
    }
  }

  if (!selectedPlantation)
    return (
      <main className={styles.statePage}>
        <strong>Selecione uma plantação</strong>
        <p>Escolha uma propriedade antes de consultar os sensores.</p>
      </main>
    );
  if (status === "loading" || status === "idle")
    return (
      <main className={styles.statePage} role="status">
        <span className={styles.spinner} />
        <strong>Carregando sensores</strong>
        <p>Consultando os dispositivos de {selectedPlantation.name}...</p>
      </main>
    );
  if (status === "error")
    return (
      <main className={styles.statePage}>
        <span className={styles.stateIcon}>
          <DashboardIcon name="alert" />
        </span>
        <strong>Monitoramento indisponível</strong>
        <p>Não foi possível consultar sensores e alertas.</p>
        <button type="button" onClick={() => void reload()}>
          Tentar novamente
        </button>
      </main>
    );

  return (
    <main className={styles.page}>
      <section className={styles.heading}>
        <div>
          <p>MONITORAMENTO DO SOLO</p>
          <h1>Sensores</h1>
          <span>
            Leituras reais de {selectedPlantation.name}, atualizadas
            automaticamente.
          </span>
        </div>
        <button
          className={styles.addButton}
          type="button"
          disabled={selectedPlantation.role !== "OWNER"}
          title={
            selectedPlantation.role !== "OWNER"
              ? "Somente proprietários podem cadastrar sensores"
              : undefined
          }
          onClick={() => setCreateOpen(true)}
        >
          <b>+</b> Adicionar sensor
        </button>
      </section>

      {notice && (
        <p className={styles.notice} role="status">
          {notice}
        </p>
      )}
      {refreshFailed && (
        <p className={styles.refreshWarning} role="status">
          Não foi possível atualizar a telemetria. Exibindo os últimos dados
          disponíveis; tente atualizar novamente.
        </p>
      )}

      <section className={styles.summary} aria-label="Resumo dos sensores">
        <article>
          <span className={styles.summaryIcon}>
            <DashboardIcon name="sensor" />
          </span>
          <div>
            <small>TOTAL DE SENSORES</small>
            <strong>{sensors.length}</strong>
            <p>em {selectedPlantation.name}</p>
          </div>
        </article>
        <article>
          <span className={styles.summaryIcon}>
            <i />
          </span>
          <div>
            <small>COM SINAL RECENTE</small>
            <strong>{onlineCount}</strong>
            <p>leitura nos últimos 15 min</p>
          </div>
        </article>
        <article>
          <span className={`${styles.summaryIcon} ${styles.attentionIcon}`}>
            <DashboardIcon name="alert" />
          </span>
          <div>
            <small>PRECISA DE ATENÇÃO</small>
            <strong>{attentionCount}</strong>
            <p>{alerts.length} alertas ativos</p>
          </div>
        </article>
        <article>
          <span className={`${styles.summaryIcon} ${styles.offlineIcon}`}>
            <span>×</span>
          </span>
          <div>
            <small>SEM CONEXÃO</small>
            <strong>{offlineCount}</strong>
            <p>sem leitura recente</p>
          </div>
        </article>
      </section>

      <section className={styles.toolbar} aria-label="Filtros dos sensores">
        <div className={styles.search}>
          <DashboardIcon name="search" size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nome ou identificador..."
            aria-label="Buscar sensores"
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
              {item.value === "attention" && attentionCount > 0 && (
                <span>{attentionCount}</span>
              )}
            </button>
          ))}
        </div>
      </section>

      {sensors.length === 0 ? (
        <section className={styles.emptyState}>
          <DashboardIcon name="sensor" size={28} />
          <strong>Nenhum sensor cadastrado</strong>
          <p>
            Cadastre o primeiro dispositivo para começar a receber leituras
            desta plantação.
          </p>
          {selectedPlantation.role === "OWNER" && (
            <button type="button" onClick={() => setCreateOpen(true)}>
              Cadastrar sensor
            </button>
          )}
        </section>
      ) : (
        <div className={styles.workspace}>
          <section className={styles.sensorList} aria-label="Lista de sensores">
            <div className={styles.listHeader}>
              <span>
                {visibleSensors.length}{" "}
                {visibleSensors.length === 1
                  ? "sensor encontrado"
                  : "sensores encontrados"}
              </span>
              <small>
                Atualizado{" "}
                {lastUpdatedAt
                  ? formatRelativeTime(lastUpdatedAt.toISOString())
                  : "agora"}
              </small>
            </div>
            <div className={styles.cards}>
              {visibleSensors.length ? (
                visibleSensors.map((sensor) => {
                  const state = getSensorState(sensor, alerts);
                  return (
                    <button
                      className={`${styles.sensorCard} ${selected?.device.id === sensor.device.id ? styles.cardSelected : ""}`}
                      type="button"
                      key={sensor.device.id}
                      onClick={() => {
                        setSelectedId(sensor.device.id);
                        setTab("now");
                      }}
                    >
                      <span
                        className={`${styles.sensorGlyph} ${styles[state]}`}
                      >
                        <DashboardIcon name="sensor" size={22} />
                      </span>
                      <span className={styles.sensorInfo}>
                        <span className={styles.sensorTitle}>
                          <span>
                            <strong>{sensor.device.name}</strong>
                            <small>{sensor.device.deviceId}</small>
                          </span>
                          <i className={styles[state]}>
                            <b />
                            {state === "online"
                              ? "Online"
                              : state === "attention"
                                ? "Atenção"
                                : "Offline"}
                          </i>
                        </span>
                        {sensor.reading ? (
                          <span className={styles.sensorReadings}>
                            <span>
                              <small>UMIDADE</small>
                              <strong>
                                {formatSensorNumber(sensor.reading.moisture)}%
                              </strong>
                            </span>
                            <span>
                              <small>TEMPERATURA</small>
                              <strong>
                                {formatSensorNumber(sensor.reading.temperature)}
                                °C
                              </strong>
                            </span>
                            <span>
                              <small>pH</small>
                              <strong>
                                {formatSensorNumber(sensor.reading.ph)}
                              </strong>
                            </span>
                          </span>
                        ) : (
                          <span className={styles.noReading}>
                            Aguardando a primeira leitura
                          </span>
                        )}
                        <span className={styles.sensorFoot}>
                          <small>
                            Atualizado{" "}
                            {formatRelativeTime(sensor.reading?.timestamp)}
                            {sensor.reading?.batteryPercentage !== null &&
                            sensor.reading?.batteryPercentage !== undefined
                              ? ` · bateria ${formatSensorNumber(sensor.reading.batteryPercentage, 0)}%${sensor.reading.charging ? " carregando" : ""}`
                              : ""}
                          </small>
                        </span>
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className={styles.empty}>
                  <DashboardIcon name="search" size={24} />
                  <strong>Nenhum sensor encontrado</strong>
                  <p>Altere a busca ou remova os filtros.</p>
                </div>
              )}
            </div>
          </section>

          {selected && (
            <section
              className={styles.details}
              aria-label={`Detalhes de ${selected.device.name}`}
            >
              {selectedPlantation.role === "OWNER" && (
                <div className={styles.maintenanceActions}>
                  <button
                    type="button"
                    onClick={() => {
                      setNotice(null);
                      setMaintenance({
                        device: selected.device,
                        action: "edit",
                      });
                    }}
                  >
                    <DashboardIcon name="settings" size={15} /> Editar sensor
                  </button>
                  <button
                    type="button"
                    className={styles.removeButton}
                    onClick={() => {
                      setNotice(null);
                      setMaintenance({
                        device: selected.device,
                        action: "remove",
                      });
                    }}
                  >
                    <DashboardIcon name="trash" size={15} /> Remover sensor
                  </button>
                </div>
              )}
              <div className={styles.detailHeader}>
                <div className={styles.detailIdentity}>
                  <span
                    className={`${styles.sensorGlyph} ${styles[selectedState]}`}
                  >
                    <DashboardIcon name="sensor" size={23} />
                  </span>
                  <div>
                    <small>{selected.device.deviceId}</small>
                    <h2>{selected.device.name}</h2>
                    <p>{selectedPlantation.name}</p>
                  </div>
                </div>
                <div className={styles.connection}>
                  <span className={styles[selectedState]}>
                    <i />
                    {selectedState === "online"
                      ? "Online"
                      : selectedState === "attention"
                        ? "Atenção"
                        : "Offline"}
                  </span>
                </div>
              </div>
              <div className={styles.metaStrip}>
                <span>
                  <DashboardIcon name="sensor" size={16} />
                  <small>IDENTIFICADOR</small>
                  <strong>{selected.device.deviceId}</strong>
                </span>
                <span>
                  <DashboardIcon name="calendar" size={16} />
                  <small>ÚLTIMA LEITURA</small>
                  <strong>{formatRelativeTime(reading?.timestamp)}</strong>
                </span>
                <span>
                  <DashboardIcon name="battery" size={16} />
                  <small>BATERIA</small>
                  <strong>
                    {reading?.batteryPercentage !== null &&
                    reading?.batteryPercentage !== undefined
                      ? `${formatSensorNumber(reading.batteryPercentage, 0)}%${reading.charging ? " · carregando" : ""}`
                      : "Sem telemetria"}
                  </strong>
                </span>
                <span>
                  <DashboardIcon name="alert" size={16} />
                  <small>ALERTAS ATIVOS</small>
                  <strong>{selectedAlerts.length}</strong>
                </span>
              </div>
              <div className={styles.tabs}>
                {tabs.map((item) => (
                  <button
                    className={tab === item.value ? styles.tabActive : ""}
                    type="button"
                    key={item.value}
                    onClick={() => setTab(item.value)}
                  >
                    {item.label}
                    {item.value === "alerts" && selectedAlerts.length > 0 && (
                      <span>{selectedAlerts.length}</span>
                    )}
                  </button>
                ))}
              </div>

              {tab === "alerts" ? (
                <div className={styles.alertPanel}>
                  {selectedAlerts.length ? (
                    <div className={styles.alertStack}>
                      {selectedAlerts.map((alert) => (
                        <article key={alert.id}>
                          <span>
                            <DashboardIcon name="alert" size={20} />
                          </span>
                          <div>
                            <small>
                              {alert.severity === "critical"
                                ? "ALERTA CRÍTICO"
                                : "ATENÇÃO"}
                            </small>
                            <strong>{alert.title}</strong>
                            <p>
                              {alert.message}{" "}
                              {alert.occurredAt
                                ? `Registrado ${formatRelativeTime(alert.occurredAt)}.`
                                : ""}
                            </p>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.noAlerts}>
                      <span>✓</span>
                      <strong>Tudo certo por aqui</strong>
                      <p>Nenhum alerta ativo para este sensor.</p>
                    </div>
                  )}
                </div>
              ) : tab === "history" ? (
                <div className={styles.historyCard}>
                  <div className={styles.historyHead}>
                    <div>
                      <p>LEITURAS RECENTES</p>
                      <h3>Variação da umidade</h3>
                    </div>
                    <span>
                      {historyStatus === "ready" && (
                        <>
                          <i /> {history.length} registros
                        </>
                      )}
                    </span>
                  </div>
                  {historyStatus === "loading" ? (
                    <div className={styles.inlineState}>
                      Carregando histórico...
                    </div>
                  ) : historyStatus === "error" ? (
                    <div className={styles.inlineState}>
                      Não foi possível carregar o histórico.
                    </div>
                  ) : history.length ? (
                    <>
                      <div className={styles.chart}>
                        <div className={styles.chartLabels}>
                          <span>100%</span>
                          <span>75%</span>
                          <span>50%</span>
                          <span>25%</span>
                        </div>
                        <svg viewBox="0 0 660 100" preserveAspectRatio="none">
                          <defs>
                            <linearGradient
                              id="sensorHistoryFill"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="0"
                                stopColor="#75ad4c"
                                stopOpacity=".28"
                              />
                              <stop
                                offset="1"
                                stopColor="#75ad4c"
                                stopOpacity="0"
                              />
                            </linearGradient>
                          </defs>
                          <path
                            d={`M ${chartPoints(history)} L 660 100 L 0 100 Z`}
                          />
                          <polyline points={chartPoints(history)} />
                        </svg>
                      </div>
                      <div className={styles.historyRange}>
                        <span>
                          {new Date(
                            history.at(-1)!.timestamp,
                          ).toLocaleDateString("pt-BR")}
                        </span>
                        <span>
                          {new Date(history[0].timestamp).toLocaleDateString(
                            "pt-BR",
                          )}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className={styles.inlineState}>
                      Ainda não há histórico para este sensor.
                    </div>
                  )}
                </div>
              ) : reading ? (
                <>
                  <div className={styles.readingGrid}>
                    <article className={styles.moistureCard}>
                      <div className={styles.gauge}>
                        <svg viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="45" />
                          <circle
                            className={
                              selectedState === "attention"
                                ? styles.gaugeWarning
                                : ""
                            }
                            cx="50"
                            cy="50"
                            r="45"
                            style={{
                              strokeDashoffset:
                                283 - (reading.moisture / 100) * 283,
                            }}
                          />
                        </svg>
                        <span>
                          <strong>
                            {formatSensorNumber(reading.moisture)}%
                          </strong>
                          <small>Umidade</small>
                        </span>
                      </div>
                      <div>
                        <small>FAIXA RECOMENDADA</small>
                        <strong>55% – 70%</strong>
                        <p
                          className={
                            reading.moisture < 55 || reading.moisture > 70
                              ? styles.textWarning
                              : ""
                          }
                        >
                          {reading.moisture < 55
                            ? "Abaixo do ideal"
                            : reading.moisture > 70
                              ? "Acima do ideal"
                              : "Dentro do ideal"}
                        </p>
                      </div>
                    </article>
                    <article>
                      <small>TEMPERATURA</small>
                      <strong>
                        {formatSensorNumber(reading.temperature)}
                        <span>°C</span>
                      </strong>
                      <p>Temperatura do solo</p>
                    </article>
                    <article>
                      <small>pH DO SOLO</small>
                      <strong>
                        {formatSensorNumber(reading.ph)}
                        <span> pH</span>
                      </strong>
                      <p>Faixa recomendada: 5,5–7</p>
                    </article>
                    <article>
                      <small>CONDUTIVIDADE</small>
                      <strong>
                        {formatSensorNumber(reading.electricalConductivity)}
                        <span> mS/cm</span>
                      </strong>
                      <p>Disponibilidade iônica</p>
                    </article>
                    <article>
                      <small>BATERIA</small>
                      <strong>
                        {reading.batteryPercentage !== null
                          ? formatSensorNumber(reading.batteryPercentage, 0)
                          : "—"}
                        <span>%</span>
                      </strong>
                      <p>
                        {reading.charging
                          ? "Carregando por energia solar"
                          : reading.batteryVoltage !== null
                            ? `${formatSensorNumber(reading.batteryVoltage)} V`
                            : "Sem telemetria"}
                      </p>
                    </article>
                  </div>
                  {reading.latitude !== null && reading.longitude !== null && (
                    <div className={styles.locationTelemetry}>
                      <DashboardIcon name="location" size={16} />
                      <span>
                        <small>LOCALIZAÇÃO ATUAL</small>
                        <strong>
                          {reading.latitude.toFixed(6)},{" "}
                          {reading.longitude.toFixed(6)}
                        </strong>
                      </span>
                    </div>
                  )}
                  <div className={styles.nutrients}>
                    <div>
                      <p>NUTRIENTES DO SOLO</p>
                      <h3>Nitrogênio, fósforo e potássio</h3>
                    </div>
                    <article>
                      <span>N</span>
                      <div>
                        <small>Nitrogênio</small>
                        <strong>
                          {formatSensorNumber(reading.nitrogen, 0)} mg/kg
                        </strong>
                      </div>
                    </article>
                    <article>
                      <span>P</span>
                      <div>
                        <small>Fósforo</small>
                        <strong>
                          {formatSensorNumber(reading.phosphorus, 0)} mg/kg
                        </strong>
                      </div>
                    </article>
                    <article>
                      <span>K</span>
                      <div>
                        <small>Potássio</small>
                        <strong>
                          {formatSensorNumber(reading.potassium, 0)} mg/kg
                        </strong>
                      </div>
                    </article>
                  </div>
                </>
              ) : (
                <div className={styles.noData}>
                  <DashboardIcon name="sensor" size={25} />
                  <strong>Aguardando a primeira leitura</strong>
                  <p>
                    O dispositivo está cadastrado, mas ainda não enviou dados ao
                    Backend IoT.
                  </p>
                </div>
              )}
            </section>
          )}
        </div>
      )}

      {createOpen && (
        <div className={styles.modalLayer}>
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
            aria-labelledby="sensor-modal-title"
          >
            <div className={styles.modalHead}>
              <span>
                <DashboardIcon name="sensor" />
              </span>
              <div>
                <p>NOVO DISPOSITIVO</p>
                <h2 id="sensor-modal-title">Cadastrar sensor</h2>
              </div>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                disabled={creating}
              >
                ×
              </button>
            </div>
            <form className={styles.createForm} onSubmit={handleCreate}>
              <label htmlFor="sensor-name">Nome do sensor</label>
              <input
                id="sensor-name"
                name="name"
                minLength={2}
                maxLength={120}
                placeholder="Ex.: Sensor Norte"
                autoFocus
                required
                disabled={creating}
              />
              <label htmlFor="sensor-device-id">Identificador físico</label>
              <input
                id="sensor-device-id"
                name="deviceId"
                minLength={3}
                maxLength={80}
                pattern="[A-Za-z0-9][A-Za-z0-9_-]{2,79}"
                placeholder="Ex.: sensor_01"
                required
                disabled={creating}
              />
              <small>Use o mesmo identificador configurado no firmware.</small>
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
                  {creating ? "Cadastrando..." : "Cadastrar sensor"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
      {maintenance && selectedPlantation.role === "OWNER" && (
        <SensorMaintenanceDialog
          key={`${maintenance.device.id}:${maintenance.action}`}
          {...maintenance}
          onClose={() => setMaintenance(null)}
          onUpdated={(device) => {
            updateDevice(device);
            setMaintenance(null);
            setNotice("Nome do sensor atualizado.");
            void reload(true);
          }}
          onRemoved={(device) => {
            removeDevice(device.id);
            setMaintenance(null);
            setSelectedId(null);
            setTab("now");
            setHistory([]);
            setNotice(
              `Sensor “${device.name}” removido do painel. As leituras do Backend IoT foram preservadas.`,
            );
            void reload(true);
          }}
        />
      )}
    </main>
  );
}
