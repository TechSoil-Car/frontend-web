"use client";

import Image from "next/image";
import { useState } from "react";
import { alerts, chartSeries, devices, sectors, soilMetrics, type ChartRange } from "../../data/dashboard-data";
import { DashboardIcon } from "../dashboard-icons/DashboardIcon";
import styles from "./DashboardOverview.module.css";

export function DashboardOverview() {
  const [range, setRange] = useState<ChartRange>("24h");
  const [selectedSectorId, setSelectedSectorId] = useState("A");
  const selectedSector = sectors.find((sector) => sector.id === selectedSectorId) ?? sectors[0];

  return (
    <div className={styles.overview}>
      <section className={styles.welcome} id="visao-geral">
        <div>
          <p>DOMINGO, 16 DE AGOSTO</p>
          <h1>Bom dia, Arthur.</h1>
          <span>Veja o que está acontecendo na sua plantação hoje.</span>
        </div>
        <div className={styles.welcomeActions}>
          <button className={styles.dateButton} type="button"><DashboardIcon name="calendar" size={17} /> Últimas 24 horas</button>
          <button className={styles.primaryButton} type="button">Nova missão <DashboardIcon name="arrow" size={17} /></button>
        </div>
      </section>

      <section className={styles.statusStrip} aria-label="Status da operação">
        <div><i /><span><small>STATUS DO SISTEMA</small><strong>Todos os dispositivos operando</strong></span></div>
        <div><small>ÚLTIMA SINCRONIZAÇÃO</small><strong>Hoje, 09:42</strong></div>
        <div><small>PRÓXIMA LEITURA</small><strong>Em 18 minutos</strong></div>
        <a href="#dispositivos">Ver dispositivos <DashboardIcon name="arrow" size={15} /></a>
      </section>

      <section className={styles.metricGrid} aria-label="Indicadores do solo">
        {soilMetrics.map((metric) => (
          <article className={styles.metricCard} key={metric.id}>
            <div className={styles.metricHead}><span>{metric.label}</span><i className={styles[metric.tone]}>{metric.status}</i></div>
            <div className={styles.metricValue}><strong>{metric.value}</strong><span>{metric.unit}</span></div>
            <div className={styles.metricFoot}>
              <span><b>{metric.trend}</b> desde ontem</span>
              <svg viewBox="0 0 100 30" preserveAspectRatio="none"><polyline points={metric.points} /></svg>
            </div>
          </article>
        ))}
      </section>

      <div className={styles.mainGrid}>
        <section className={styles.fieldCard} id="plantacao">
          <div className={styles.cardHeader}>
            <div><p>VISÃO DA PROPRIEDADE</p><h2>Saúde por setor</h2></div>
            <a href="/dashboard#plantacao">Ver análise completa <DashboardIcon name="arrow" size={15} /></a>
          </div>
          <div className={styles.fieldMap}>
            <Image src="/vineyard-sectors.png" alt="Vista aérea dos setores da Fazenda Ferragut" fill sizes="(max-width: 980px) 100vw, 60vw" />
            <div className={styles.mapShade} />
            <div className={styles.mapTop}><span><i /> Monitoramento ao vivo</span><small>42,8 hectares</small></div>
            {sectors.map((sector) => (
              <button className={`${styles.sector} ${styles[sector.position]} ${selectedSectorId === sector.id ? styles.sectorActive : ""} ${sector.id === "C" ? styles.sectorWarning : ""}`} type="button" key={sector.id} onClick={() => setSelectedSectorId(sector.id)}>
                <span>{sector.id}</span>
              </button>
            ))}
            <div className={styles.sectorPanel}>
              <div><span>SETOR SELECIONADO</span><i className={selectedSector.id === "C" ? styles.warningDot : ""}>{selectedSector.status}</i></div>
              <h3>{selectedSector.name}</h3>
              <p>Umidade média <strong>{selectedSector.moisture}</strong></p>
              <div className={styles.sectorScale}><i style={{ width: selectedSector.moisture }} /></div>
              <small>12 fileiras · última leitura há 18 min</small>
            </div>
            <div className={styles.mapLegend}><span><i /> Saudável</span><span><i /> Atenção</span></div>
          </div>
        </section>

        <section className={styles.alertCard} id="alertas">
          <div className={styles.cardHeader}><div><p>ATENÇÃO</p><h2>Alertas recentes</h2></div><span className={styles.alertCount}>2 novos</span></div>
          <div className={styles.alertList}>
            {alerts.map((alert) => (
              <article key={alert.id}>
                <span className={`${styles.alertIcon} ${styles[alert.level]}`}><DashboardIcon name={alert.level === "warning" ? "alert" : alert.level === "success" ? "sensor" : "mission"} size={17} /></span>
                <div><strong>{alert.title}</strong><p>{alert.detail}</p><small>{alert.time}</small></div>
                <DashboardIcon name="chevron" size={16} />
              </article>
            ))}
          </div>
          <button className={styles.secondaryButton} type="button">Ver todos os alertas</button>
        </section>
      </div>

      <div className={styles.lowerGrid}>
        <section className={styles.chartCard} id="atividade">
          <div className={styles.cardHeader}>
            <div><p>HISTÓRICO</p><h2>Umidade do solo</h2></div>
            <div className={styles.rangePicker}>{(["24h", "7d", "30d"] as ChartRange[]).map((item) => <button className={range === item ? styles.rangeActive : ""} type="button" key={item} onClick={() => setRange(item)}>{item}</button>)}</div>
          </div>
          <div className={styles.chartSummary}><strong>64%</strong><span><i /> dentro da faixa ideal</span></div>
          <div className={styles.chartWrap}>
            <div className={styles.chartLabels}><span>80%</span><span>60%</span><span>40%</span><span>20%</span></div>
            <svg viewBox="0 0 660 100" preserveAspectRatio="none" aria-label={`Umidade nas últimas ${range}`}>
              <defs><linearGradient id="dashboardChartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#79b84b" stopOpacity=".28"/><stop offset="1" stopColor="#79b84b" stopOpacity="0"/></linearGradient></defs>
              <path className={styles.chartArea} d={`M ${chartSeries[range]} L 660 100 L 0 100 Z`} />
              <polyline className={styles.chartLine} points={chartSeries[range]} />
            </svg>
          </div>
          <div className={styles.chartAxis}><span>00h</span><span>06h</span><span>12h</span><span>18h</span><span>Agora</span></div>
        </section>

        <section className={styles.deviceCard} id="dispositivos">
          <div className={styles.cardHeader}><div><p>DISPOSITIVOS</p><h2>Operação</h2></div><span className={styles.onlineBadge}><i /> 3 online</span></div>
          <div className={styles.deviceList}>
            {devices.map((device) => (
              <article key={device.code}>
                <span className={styles.deviceIcon}><DashboardIcon name={device.code.startsWith("TC") ? "mission" : "sensor"} size={19} /></span>
                <div><strong>{device.name}</strong><small>{device.code} · {device.state}</small></div>
                <span className={styles.battery}><DashboardIcon name="battery" size={15} /> {device.battery}%</span>
              </article>
            ))}
          </div>
          <button className={styles.secondaryButton} type="button">Gerenciar dispositivos</button>
        </section>
      </div>
    </div>
  );
}
