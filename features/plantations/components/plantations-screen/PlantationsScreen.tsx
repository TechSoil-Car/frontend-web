"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { DashboardIcon } from "@/features/dashboard/components/dashboard-icons/DashboardIcon";
import { plantations, type PlantationFilter } from "../../data/plantations-data";
import styles from "./PlantationsScreen.module.css";

const filters: Array<{ label: string; value: PlantationFilter }> = [
  { label: "Todas", value: "all" },
  { label: "Operando", value: "operating" },
  { label: "Atenção", value: "attention" },
];

export function PlantationsScreen() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<PlantationFilter>("all");
  const [selectedId, setSelectedId] = useState<string>(plantations[0].id);

  const visiblePlantations = useMemo(() => plantations.filter((plantation) => {
    const matchesFilter = filter === "all" || plantation.statusKey === filter;
    const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
    const matchesQuery = !normalizedQuery || `${plantation.name} ${plantation.location}`.toLocaleLowerCase("pt-BR").includes(normalizedQuery);
    return matchesFilter && matchesQuery;
  }), [filter, query]);

  const selected = plantations.find((plantation) => plantation.id === selectedId) ?? plantations[0];

  return (
    <main className={styles.page}>
      <section className={styles.heading}>
        <div><p>GESTÃO DA PROPRIEDADE</p><h1>Suas plantações</h1><span>Acompanhe e organize todas as áreas conectadas à TechSoil.</span></div>
        <button className={styles.addButton} type="button"><b>+</b> Nova plantação</button>
      </section>

      <section className={styles.summary} aria-label="Resumo das plantações">
        <article><span className={styles.summaryIcon}><DashboardIcon name="field" /></span><div><small>PROPRIEDADES</small><strong>3</strong><p>2 operando normalmente</p></div></article>
        <article><span className={styles.summaryIcon}><span>ha</span></span><div><small>ÁREA MONITORADA</small><strong>96,4 ha</strong><p>7 setores cadastrados</p></div></article>
        <article><span className={styles.summaryIcon}><DashboardIcon name="sensor" /></span><div><small>DISPOSITIVOS</small><strong>8</strong><p>Todos conectados</p></div></article>
        <article><span className={`${styles.summaryIcon} ${styles.summaryAlert}`}><DashboardIcon name="alert" /></span><div><small>PRECISA DE ATENÇÃO</small><strong>1</strong><p>Sítio Boa Vista</p></div></article>
      </section>

      <section className={styles.toolbar} aria-label="Filtros das plantações">
        <div className={styles.search}><DashboardIcon name="search" size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nome ou localização..." aria-label="Buscar plantações" /></div>
        <div className={styles.filters}>{filters.map((item) => <button className={filter === item.value ? styles.filterActive : ""} type="button" key={item.value} onClick={() => setFilter(item.value)}>{item.label}{item.value === "attention" && <span>1</span>}</button>)}</div>
      </section>

      <div className={styles.contentGrid}>
        <section className={styles.list} aria-label="Lista de plantações">
          <div className={styles.listHeader}><span>{visiblePlantations.length} propriedades encontradas</span><button type="button">Ordenar por <strong>saúde</strong>⌄</button></div>
          {visiblePlantations.length ? visiblePlantations.map((plantation) => (
            <button className={`${styles.plantationCard} ${selected.id === plantation.id ? styles.cardSelected : ""}`} type="button" key={plantation.id} onClick={() => setSelectedId(plantation.id)}>
              <span className={styles.cardImage}>
                <Image src={plantation.image} alt="" fill sizes="180px" />
                <i className={styles[plantation.statusKey]}><b />{plantation.status}</i>
              </span>
              <span className={styles.cardContent}>
                <span className={styles.cardTitle}><span><strong>{plantation.name}</strong><small>{plantation.location}</small></span><DashboardIcon name="chevron" size={17} /></span>
                <span className={styles.cardStats}><span><small>ÁREA</small><strong>{plantation.area}</strong></span><span><small>SETORES</small><strong>{plantation.sectors}</strong></span><span><small>DISPOSITIVOS</small><strong>{plantation.devices}</strong></span></span>
                <span className={styles.health}><span><small>Saúde geral</small><strong>{plantation.health}%</strong></span><span className={styles.healthTrack}><i style={{ width: `${plantation.health}%` }} /></span></span>
              </span>
            </button>
          )) : <div className={styles.empty}><DashboardIcon name="search" size={24} /><strong>Nenhuma plantação encontrada</strong><p>Tente buscar por outro nome ou remova os filtros.</p></div>}
        </section>

        <aside className={styles.details} aria-label={`Resumo de ${selected.name}`}>
          <div className={styles.detailHero}>
            <Image src={selected.image} alt={`Vista aérea de ${selected.name}`} fill sizes="380px" />
            <div />
            <span className={styles.detailStatus}><i /> {selected.status}</span>
            <span className={styles.detailIdentity}><b>{selected.initials}</b><span><strong>{selected.name}</strong><small>{selected.location}</small></span></span>
          </div>
          <div className={styles.detailBody}>
            <div className={styles.detailHead}><div><p>SAÚDE GERAL</p><strong>{selected.health}%</strong></div><span className={styles.score}><i style={{ width: `${selected.health}%` }} /></span></div>
            <div className={styles.detailMetrics}>
              <article><small>Umidade média</small><strong>{selected.moisture}</strong><span>Faixa ideal: 55–70%</span></article>
              <article><small>Estrutura</small><strong>{selected.rows} fileiras</strong><span>{selected.sectors} setores ativos</span></article>
            </div>
            <div className={styles.latest}><span className={selected.statusKey === "attention" ? styles.latestWarning : ""}><DashboardIcon name={selected.statusKey === "attention" ? "alert" : "sensor"} size={17} /></span><div><small>STATUS MAIS RECENTE</small><strong>{selected.alert}</strong><p>Última leitura {selected.lastReading}</p></div></div>
            <button className={styles.openButton} type="button">Abrir propriedade <DashboardIcon name="arrow" size={17} /></button>
            <button className={styles.secondaryButton} type="button">Editar informações</button>
          </div>
        </aside>
      </div>
    </main>
  );
}
