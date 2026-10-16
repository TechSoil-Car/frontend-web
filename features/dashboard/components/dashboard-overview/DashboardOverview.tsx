"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/features/auth";
import { usePlantations } from "@/features/plantations/context/PlantationContext";
import { useSensorMonitoring } from "@/features/sensors/hooks/use-sensor-monitoring";
import { formatRelativeTime, formatSensorNumber, getSensorState } from "@/features/sensors/utils/sensor-status";
import { DashboardIcon } from "../dashboard-icons/DashboardIcon";
import styles from "./DashboardOverview.module.css";

function average(values: number[]) {
  return values.length ? values.reduce((total, value) => total + value, 0) / values.length : undefined;
}

export function DashboardOverview() {
  const { selectedPlantation } = usePlantations();
  return <DashboardOverviewContent key={selectedPlantation?.id ?? "none"} />;
}

function DashboardOverviewContent() {
  const { user } = useAuth();
  const { selectedPlantation } = usePlantations();
  const { sensors, alerts, status, lastUpdatedAt, reload } = useSensorMonitoring(selectedPlantation?.id);
  const [selectedSensorId, setSelectedSensorId] = useState<string | null>(null);
  const firstName = user?.name.split(/\s+/)[0] ?? "produtor";
  const today = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long" }).format(new Date()).toLocaleUpperCase("pt-BR");

  const readings = sensors.flatMap((sensor) => sensor.reading ? [sensor.reading] : []);
  const onlineSensors = sensors.filter((sensor) => getSensorState(sensor, alerts) !== "offline");
  const selectedSensor = sensors.find((sensor) => sensor.device.id === selectedSensorId) ?? sensors[0] ?? null;
  const selectedState = selectedSensor ? getSensorState(selectedSensor, alerts) : "offline";

  const metrics = [
    { id: "moisture", label: "Umidade média", value: formatSensorNumber(average(readings.map((reading) => reading.moisture))), unit: "%", hint: "Faixa ideal: 55–70%", tone: "green" },
    { id: "temperature", label: "Temperatura média", value: formatSensorNumber(average(readings.map((reading) => reading.temperature))), unit: "°C", hint: "Média das últimas leituras", tone: "amber" },
    { id: "ph", label: "pH médio", value: formatSensorNumber(average(readings.map((reading) => reading.ph))), unit: "pH", hint: "Faixa ideal: 5,5–7", tone: "green" },
    { id: "conductivity", label: "Condutividade média", value: formatSensorNumber(average(readings.map((reading) => reading.electricalConductivity))), unit: "mS/cm", hint: "Disponibilidade iônica", tone: "orange" },
  ];
  const nutrientAverages = [
    { symbol: "N", label: "Nitrogênio", value: average(readings.map((reading) => reading.nitrogen)) },
    { symbol: "P", label: "Fósforo", value: average(readings.map((reading) => reading.phosphorus)) },
    { symbol: "K", label: "Potássio", value: average(readings.map((reading) => reading.potassium)) },
  ];

  return (
    <div className={styles.overview}>
      <section className={styles.welcome} id="visao-geral">
        <div><p>{today}</p><h1>Olá, {firstName}.</h1><span>Visão operacional de {selectedPlantation?.name ?? "sua plantação"}.</span></div>
        <div className={styles.welcomeActions}><button className={styles.dateButton} type="button" onClick={() => void reload()} disabled={status === "loading"}><DashboardIcon name="refresh" size={17} /> Atualizar dados</button><Link className={styles.primaryButton} href="/dashboard/sensores">Ver sensores <DashboardIcon name="arrow" size={17} /></Link></div>
      </section>

      <section className={`${styles.statusStrip} ${status === "error" ? styles.statusError : ""}`} aria-label="Status da operação">
        <div><i /><span><small>STATUS DO MONITORAMENTO</small><strong>{status === "error" ? "Comunicação indisponível" : sensors.length === 0 ? "Nenhum sensor cadastrado" : `${onlineSensors.length} de ${sensors.length} sensores com sinal recente`}</strong></span></div>
        <div><small>ÚLTIMA SINCRONIZAÇÃO</small><strong>{lastUpdatedAt ? formatRelativeTime(lastUpdatedAt.toISOString()) : "Aguardando"}</strong></div>
        <div><small>ATUALIZAÇÃO AUTOMÁTICA</small><strong>A cada 1 minuto</strong></div>
        <Link href="/dashboard/sensores">Detalhes <DashboardIcon name="arrow" size={15} /></Link>
      </section>

      <section className={styles.metricGrid} aria-label="Indicadores médios do solo">
        {metrics.map((metric) => <article className={styles.metricCard} key={metric.id}><div className={styles.metricHead}><span>{metric.label}</span><i className={styles[metric.tone]}>{readings.length ? "Atual" : "Sem dados"}</i></div><div className={styles.metricValue}><strong>{metric.value}</strong><span>{metric.unit}</span></div><div className={styles.metricFoot}><span>{metric.hint}</span><small>{readings.length} {readings.length === 1 ? "leitura" : "leituras"}</small></div></article>)}
      </section>

      <div className={styles.mainGrid}>
        <section className={styles.fieldCard} id="plantacao">
          <div className={styles.cardHeader}><div><p>VISÃO OPERACIONAL</p><h2>Pontos monitorados</h2></div><Link href="/dashboard/sensores">Abrir sensores <DashboardIcon name="arrow" size={15} /></Link></div>
          <div className={styles.fieldMap}>
            <Image src="/vineyard-sectors.png" alt="Vista ilustrativa da propriedade monitorada" fill sizes="(max-width: 980px) 100vw, 60vw" /><div className={styles.mapShade} />
            <div className={styles.mapTop}><span><i /> Dados reais sobre imagem ilustrativa</span><small>{sensors.length} pontos cadastrados</small></div>
            {sensors.slice(0, 6).map((sensor, index) => {
              const state = getSensorState(sensor, alerts);
              return <button className={`${styles.sensorPoint} ${styles[`point${index + 1}`]} ${styles[state]} ${selectedSensor?.device.id === sensor.device.id ? styles.sensorPointActive : ""}`} type="button" key={sensor.device.id} onClick={() => setSelectedSensorId(sensor.device.id)} aria-label={`Selecionar ${sensor.device.name}`}><DashboardIcon name="sensor" size={15} /></button>;
            })}
            {selectedSensor ? <div className={styles.sectorPanel}><div><span>SENSOR SELECIONADO</span><i className={selectedState === "offline" ? styles.warningDot : ""}>{selectedState === "online" ? "Online" : selectedState === "attention" ? "Atenção" : "Offline"}</i></div><h3>{selectedSensor.device.name}</h3><p>{selectedSensor.device.deviceId}</p>{selectedSensor.reading ? <><div className={styles.liveReading}><strong>{formatSensorNumber(selectedSensor.reading.moisture)}%</strong><span>umidade · {formatRelativeTime(selectedSensor.reading.timestamp)}</span></div><div className={styles.sectorScale}><i style={{ width: `${Math.max(0, Math.min(100, selectedSensor.reading.moisture))}%` }} /></div></> : <small>Aguardando a primeira leitura</small>}</div> : <div className={styles.noSensorOverlay}><DashboardIcon name="sensor" /><strong>Sem pontos monitorados</strong><small>Cadastre um sensor para iniciar.</small></div>}
            <div className={styles.mapLegend}><span><i /> Online</span><span><i /> Atenção/offline</span></div>
          </div>
        </section>

        <section className={styles.alertCard} id="alertas">
          <div className={styles.cardHeader}><div><p>ATENÇÃO</p><h2>Alertas ativos</h2></div><span className={styles.alertCount}>{alerts.length}</span></div>
          <div className={styles.alertList}>{alerts.length ? alerts.slice(0, 4).map((alert) => <article key={alert.id}><span className={`${styles.alertIcon} ${styles[alert.severity === "critical" ? "warning" : "info"]}`}><DashboardIcon name="alert" size={17} /></span><div><strong>{alert.title}</strong><p>{alert.device.name}</p><small>{formatRelativeTime(alert.occurredAt)}</small></div><DashboardIcon name="chevron" size={16} /></article>) : <div className={styles.dashboardEmpty}><span>✓</span><strong>Nenhum alerta ativo</strong><p>As últimas leituras estão dentro das regras monitoradas.</p></div>}</div>
          <Link className={styles.secondaryButton} href="/dashboard/sensores">Ver monitoramento completo</Link>
        </section>
      </div>

      <div className={styles.lowerGrid}>
        <section className={styles.chartCard}>
          <div className={styles.cardHeader}><div><p>NUTRIENTES</p><h2>Média das últimas leituras</h2></div><span className={styles.onlineBadge}>{readings.length} amostras</span></div>
          <div className={styles.nutrientOverview}>{nutrientAverages.map((nutrient) => <article key={nutrient.symbol}><span>{nutrient.symbol}</span><div><small>{nutrient.label}</small><strong>{formatSensorNumber(nutrient.value, 0)} <i>mg/kg</i></strong></div></article>)}</div>
          <p className={styles.dataNote}>Os valores representam a média da leitura mais recente de cada sensor com dados disponíveis.</p>
        </section>

        <section className={styles.deviceCard} id="dispositivos">
          <div className={styles.cardHeader}><div><p>SENSORES</p><h2>Operação atual</h2></div><span className={styles.onlineBadge}><i /> {onlineSensors.length} online</span></div>
          <div className={styles.deviceList}>{sensors.length ? sensors.slice(0, 4).map((sensor) => { const state = getSensorState(sensor, alerts); return <article key={sensor.device.id}><span className={`${styles.deviceIcon} ${styles[state]}`}><DashboardIcon name="sensor" size={19} /></span><div><strong>{sensor.device.name}</strong><small>{sensor.device.deviceId} · {formatRelativeTime(sensor.reading?.timestamp)}</small></div><span className={styles.deviceState}>{state === "online" ? "Online" : state === "attention" ? "Atenção" : "Offline"}</span></article>; }) : <div className={styles.dashboardEmpty}><strong>Nenhum sensor cadastrado</strong><p>Adicione dispositivos na tela de sensores.</p></div>}</div>
          <Link className={styles.secondaryButton} href="/dashboard/sensores">Gerenciar sensores</Link>
        </section>
      </div>
    </div>
  );
}
