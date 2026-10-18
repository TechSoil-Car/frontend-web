"use client";

import { FormEvent, useState } from "react";
import { DashboardIcon } from "@/features/dashboard/components/dashboard-icons/DashboardIcon";
import { usePlantations } from "@/features/plantations/context/PlantationContext";
import { errorMessage } from "@/shared/api/error-message";
import { EmptyState, LoadingState } from "@/shared/components/empty-state/EmptyState";
import { useSensorHistory } from "../../hooks/use-sensor-history";
import { sensorFilters, useSensorList } from "../../hooks/use-sensor-list";
import { useSensorMonitoring } from "../../hooks/use-sensor-monitoring";
import * as sensorsApi from "../../services/sensors-api";
import type { Device } from "../../types/sensor.types";
import { formatRelativeTime, getSensorState } from "../../utils/sensor-status";
import { CreateSensorDialog } from "./CreateSensorDialog";
import { SensorCard } from "./SensorCard";
import { SensorDetails, type SensorTab } from "./SensorDetails";
import { SensorMaintenanceDialog } from "./SensorMaintenanceDialog";
import { SensorsSummary } from "./SensorsSummary";
import styles from "./SensorsScreen.module.css";

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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<SensorTab>("now");
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [maintenance, setMaintenance] = useState<{
    device: Device;
    action: "edit" | "remove";
  } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const {
    query,
    setQuery,
    filter,
    setFilter,
    visibleSensors,
    onlineCount,
    attentionCount,
    offlineCount,
  } = useSensorList(sensors, alerts);

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

  const {
    history,
    status: historyStatus,
    clearHistory,
  } = useSensorHistory(selectedPlantation, selected, tab === "history");

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
        errorMessage(error, "Não foi possível cadastrar o sensor."),
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
      <main className={styles.page}>
        <LoadingState
          title="Carregando sensores"
          text={`Consultando os dispositivos de ${selectedPlantation.name}...`}
        />
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

      <SensorsSummary
        plantationName={selectedPlantation.name}
        total={sensors.length}
        onlineCount={onlineCount}
        attentionCount={attentionCount}
        offlineCount={offlineCount}
        alertCount={alerts.length}
      />

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
          {sensorFilters.map((item) => (
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
        <div className={styles.emptyBlock}>
          <EmptyState
            art="sensor"
            title="Nenhum sensor cadastrado"
            text="Cadastre o primeiro dispositivo para começar a receber leituras desta plantação."
          >
            {selectedPlantation.role === "OWNER" && (
              <button type="button" onClick={() => setCreateOpen(true)}>
                Cadastrar sensor
              </button>
            )}
          </EmptyState>
        </div>
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
                visibleSensors.map((sensor) => (
                  <SensorCard
                    key={sensor.device.id}
                    sensor={sensor}
                    state={getSensorState(sensor, alerts)}
                    selected={selected?.device.id === sensor.device.id}
                    onSelect={() => {
                      setSelectedId(sensor.device.id);
                      setTab("now");
                    }}
                  />
                ))
              ) : (
                <EmptyState
                  art="search"
                  variant="plain"
                  title="Nenhum sensor encontrado"
                  text="Altere a busca ou remova os filtros."
                />
              )}
            </div>
          </section>

          {selected && (
            <SensorDetails
              plantation={selectedPlantation}
              sensor={selected}
              state={selectedState}
              alerts={selectedAlerts}
              tab={tab}
              onTab={setTab}
              history={history}
              historyStatus={historyStatus}
              onMaintenance={(action) => {
                setNotice(null);
                setMaintenance({ device: selected.device, action });
              }}
            />
          )}
        </div>
      )}

      {createOpen && (
        <CreateSensorDialog
          creating={creating}
          error={createError}
          onClose={() => setCreateOpen(false)}
          onSubmit={handleCreate}
        />
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
            clearHistory();
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
