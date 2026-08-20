"use client";

import { useMemo, useState } from "react";
import { DashboardIcon } from "@/features/dashboard/components/dashboard-icons/DashboardIcon";
import { sensors, type SensorFilter, type SensorTab } from "../../data/sensors-data";
import styles from "./SensorsScreen.module.css";

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

export function SensorsScreen() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<SensorFilter>("all");
  const [selectedId, setSelectedId] = useState<string>(sensors[0].id);
  const [tab, setTab] = useState<SensorTab>("now");

  const visibleSensors = useMemo(() => sensors.filter((sensor) => {
    const matchesStatus = filter === "all" || (filter === "attention" ? sensor.conditionKey === "attention" : sensor.statusKey === filter);
    const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
    const matchesQuery = !normalizedQuery || `${sensor.name} ${sensor.code} ${sensor.plantation} ${sensor.sector}`.toLocaleLowerCase("pt-BR").includes(normalizedQuery);
    return matchesStatus && matchesQuery;
  }), [filter, query]);

  const selected = visibleSensors.find((sensor) => sensor.id === selectedId) ?? visibleSensors[0] ?? sensors[0];
  const gaugeOffset = 283 - (selected.moisture / 100) * 283;

  return (
    <main className={styles.page}>
      <section className={styles.heading}>
        <div><p>MONITORAMENTO DO SOLO</p><h1>Sensores</h1><span>Acompanhe leituras, conectividade e a saúde de cada ponto do campo.</span></div>
        <button className={styles.addButton} type="button"><b>+</b> Adicionar sensor</button>
      </section>

      <section className={styles.summary} aria-label="Resumo dos sensores">
        <article><span className={styles.summaryIcon}><DashboardIcon name="sensor" /></span><div><small>TOTAL DE SENSORES</small><strong>5</strong><p>Em 3 propriedades</p></div></article>
        <article><span className={styles.summaryIcon}><i /></span><div><small>ONLINE AGORA</small><strong>4</strong><p>Sincronizando normalmente</p></div></article>
        <article><span className={`${styles.summaryIcon} ${styles.attentionIcon}`}><DashboardIcon name="alert" /></span><div><small>PRECISA DE ATENÇÃO</small><strong>1</strong><p>Umidade abaixo do ideal</p></div></article>
        <article><span className={`${styles.summaryIcon} ${styles.offlineIcon}`}><span>×</span></span><div><small>SEM CONEXÃO</small><strong>1</strong><p>Último sinal há 2 horas</p></div></article>
      </section>

      <section className={styles.toolbar} aria-label="Filtros dos sensores">
        <div className={styles.search}><DashboardIcon name="search" size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nome, código ou setor..." aria-label="Buscar sensores" /></div>
        <div className={styles.filters}>{filters.map((item) => <button className={filter === item.value ? styles.filterActive : ""} type="button" key={item.value} onClick={() => setFilter(item.value)}>{item.label}{item.value === "attention" && <span>1</span>}</button>)}</div>
      </section>

      <div className={styles.workspace}>
        <section className={styles.sensorList} aria-label="Lista de sensores">
          <div className={styles.listHeader}><span>{visibleSensors.length} {visibleSensors.length === 1 ? "sensor encontrado" : "sensores encontrados"}</span><button type="button">Ordenar por <strong>status</strong>⌄</button></div>
          <div className={styles.cards}>
            {visibleSensors.length ? visibleSensors.map((sensor) => (
              <button className={`${styles.sensorCard} ${selected.id === sensor.id ? styles.cardSelected : ""}`} type="button" key={sensor.id} onClick={() => { setSelectedId(sensor.id); setTab("now"); }}>
                <span className={`${styles.sensorGlyph} ${styles[sensor.conditionKey]}`}><DashboardIcon name="sensor" size={22} /></span>
                <span className={styles.sensorInfo}>
                  <span className={styles.sensorTitle}><span><strong>{sensor.name}</strong><small>{sensor.code} · {sensor.sector}</small></span><i className={styles[sensor.statusKey]}><b />{sensor.status}</i></span>
                  <span className={styles.sensorReadings}><span><small>UMIDADE</small><strong>{sensor.moisture}%</strong></span><span><small>TEMPERATURA</small><strong>{sensor.temperature.toFixed(1).replace(".", ",")}°C</strong></span><span><small>pH</small><strong>{sensor.ph.toFixed(1).replace(".", ",")}</strong></span></span>
                  <span className={styles.sensorFoot}><span><DashboardIcon name="battery" size={15} /> {sensor.battery}%</span><span>{sensor.signal}</span><small>Atualizado {sensor.lastSync}</small></span>
                </span>
              </button>
            )) : <div className={styles.empty}><DashboardIcon name="search" size={24} /><strong>Nenhum sensor encontrado</strong><p>Altere a busca ou remova os filtros.</p></div>}
          </div>
        </section>

        <section className={styles.details} aria-label={`Detalhes de ${selected.name}`}>
          <div className={styles.detailHeader}>
            <div className={styles.detailIdentity}><span className={`${styles.sensorGlyph} ${styles[selected.conditionKey]}`}><DashboardIcon name="sensor" size={23} /></span><div><small>{selected.code}</small><h2>{selected.name}</h2><p>{selected.plantation} · {selected.sector}</p></div></div>
            <div className={styles.connection}><span className={styles[selected.statusKey]}><i />{selected.status}</span><button type="button" aria-label="Opções do sensor">•••</button></div>
          </div>

          <div className={styles.metaStrip}>
            <span><DashboardIcon name="battery" size={16} /><small>BATERIA</small><strong>{selected.battery}%</strong></span>
            <span><DashboardIcon name="sensor" size={16} /><small>SINAL</small><strong>{selected.signal}</strong></span>
            <span><DashboardIcon name="calendar" size={16} /><small>ÚLTIMA LEITURA</small><strong>{selected.lastSync}</strong></span>
          </div>

          <div className={styles.tabs}>{tabs.map((item) => <button className={tab === item.value ? styles.tabActive : ""} type="button" key={item.value} onClick={() => setTab(item.value)}>{item.label}{item.value === "alerts" && selected.conditionKey === "attention" && <span>1</span>}</button>)}</div>

          {tab === "alerts" ? (
            <div className={styles.alertPanel}>
              {selected.conditionKey === "attention" ? <article><span><DashboardIcon name="alert" size={20} /></span><div><small>ALERTA ATIVO</small><strong>Umidade abaixo da faixa recomendada</strong><p>A leitura está em {selected.moisture}%. Recomendamos verificar a irrigação do {selected.sector.toLocaleLowerCase("pt-BR")}.</p><button type="button">Marcar como analisado</button></div></article> : <div className={styles.noAlerts}><span>✓</span><strong>Tudo certo por aqui</strong><p>Nenhum alerta ativo para este sensor.</p></div>}
            </div>
          ) : (
            <>
              <div className={styles.readingGrid}>
                <article className={styles.moistureCard}>
                  <div className={styles.gauge}><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="45"/><circle className={selected.conditionKey === "attention" ? styles.gaugeWarning : ""} cx="50" cy="50" r="45" style={{ strokeDashoffset: gaugeOffset }} /></svg><span><strong>{selected.moisture}%</strong><small>Umidade</small></span></div>
                  <div><small>FAIXA RECOMENDADA</small><strong>55% – 70%</strong><p className={selected.conditionKey === "attention" ? styles.textWarning : ""}>{selected.conditionKey === "attention" ? "Abaixo do ideal" : "Dentro do ideal"}</p></div>
                </article>
                <article><small>TEMPERATURA</small><strong>{selected.temperature.toFixed(1).replace(".", ",")}<span>°C</span></strong><p>Solo estável</p></article>
                <article><small>pH DO SOLO</small><strong>{selected.ph.toFixed(1).replace(".", ",")}<span> pH</span></strong><p>{selected.ph < 6 ? "Levemente ácido" : "Faixa adequada"}</p></article>
                <article><small>CONDUTIVIDADE</small><strong>{selected.conductivity.toFixed(1).replace(".", ",")}<span> mS/cm</span></strong><p>Disponibilidade iônica</p></article>
              </div>

              <div className={styles.nutrients}>
                <div><p>NUTRIENTES DO SOLO</p><h3>Nitrogênio, fósforo e potássio</h3></div>
                <article><span>N</span><div><small>Nitrogênio</small><strong>{selected.nitrogen} mg/kg</strong></div></article>
                <article><span>P</span><div><small>Fósforo</small><strong>{selected.phosphorus} mg/kg</strong></div></article>
                <article><span>K</span><div><small>Potássio</small><strong>{selected.potassium} mg/kg</strong></div></article>
              </div>

              <div className={styles.historyCard}>
                <div className={styles.historyHead}><div><p>{tab === "history" ? "ÚLTIMOS 30 DIAS" : "ÚLTIMAS 24 HORAS"}</p><h3>Variação da umidade</h3></div><span><i /> Média de {selected.moisture}%</span></div>
                <div className={styles.chart}><div className={styles.chartLabels}><span>80%</span><span>60%</span><span>40%</span><span>20%</span></div><svg viewBox="0 0 660 100" preserveAspectRatio="none"><defs><linearGradient id="sensorHistoryFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#75ad4c" stopOpacity=".28"/><stop offset="1" stopColor="#75ad4c" stopOpacity="0"/></linearGradient></defs><path d={`M ${selected.history} L 660 100 L 0 100 Z`}/><polyline points={selected.history}/></svg></div>
                <div className={styles.chartAxis}><span>{tab === "history" ? "20 jul" : "00h"}</span><span>{tab === "history" ? "27 jul" : "06h"}</span><span>{tab === "history" ? "03 ago" : "12h"}</span><span>{tab === "history" ? "10 ago" : "18h"}</span><span>Agora</span></div>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
