"use client";

import { FormEvent, useEffect, useState } from "react";
import { DashboardIcon } from "@/features/dashboard/components/dashboard-icons/DashboardIcon";
import { usePlantations } from "@/features/plantations/context/PlantationContext";
import { ApiError } from "@/shared/api/api-client";
import * as sensorsApi from "../../services/sensors-api";
import type { AlertSettings, UpdateAlertSettingsInput } from "../../types/sensor.types";
import styles from "./AlertSettingsScreen.module.css";

type RangeKey = "moisture" | "temperature" | "ph";

const rangeCards: Array<{ key: RangeKey; title: string; description: string; unit: string; min: number; max: number; step: number }> = [
  { key: "moisture", title: "Umidade do solo", description: "Avisa quando a umidade sair da faixa definida para a cultura.", unit: "%", min: 0, max: 100, step: 0.1 },
  { key: "temperature", title: "Temperatura do solo", description: "Monitora temperaturas abaixo ou acima dos limites operacionais.", unit: "°C", min: -40, max: 80, step: 0.1 },
  { key: "ph", title: "pH do solo", description: "Ative somente após validar a faixa adequada com um especialista.", unit: "pH", min: 0, max: 14, step: 0.1 },
];

export function AlertSettingsScreen() {
  const { selectedPlantation } = usePlantations();
  const [settings, setSettings] = useState<AlertSettings | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!selectedPlantation) return;
    let active = true;
    const timer = window.setTimeout(() => {
      setStatus("loading");
      setMessage(null);
      sensorsApi.getAlertSettings(selectedPlantation.id)
        .then((result) => { if (active) { setSettings(result); setStatus("ready"); } })
        .catch(() => { if (active) setStatus("error"); });
    }, 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [selectedPlantation]);

  function update<K extends keyof AlertSettings>(key: K, value: AlertSettings[K]) {
    setSettings((current) => current ? { ...current, [key]: value } : current);
    setMessage(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedPlantation || !settings || selectedPlantation.role !== "OWNER") return;
    setSaving(true);
    setMessage(null);
    const input: UpdateAlertSettingsInput = {
      noDataEnabled: settings.noDataEnabled,
      offlineEnabled: settings.offlineEnabled,
      offlineAfterMinutes: settings.offlineAfterMinutes,
      lowBatteryEnabled: settings.lowBatteryEnabled,
      lowBatteryPercentage: settings.lowBatteryPercentage,
      moistureEnabled: settings.moistureEnabled,
      moistureMin: settings.moistureMin,
      moistureMax: settings.moistureMax,
      temperatureEnabled: settings.temperatureEnabled,
      temperatureMin: settings.temperatureMin,
      temperatureMax: settings.temperatureMax,
      phEnabled: settings.phEnabled,
      phMin: settings.phMin,
      phMax: settings.phMax,
    };
    try {
      const saved = await sensorsApi.updateAlertSettings(selectedPlantation.id, input);
      setSettings(saved);
      setMessage({ tone: "success", text: "Configurações salvas. As próximas leituras usarão estes limites." });
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof ApiError ? error.message : "Não foi possível salvar as configurações." });
    } finally {
      setSaving(false);
    }
  }

  if (!selectedPlantation) return <main className={styles.state}><strong>Selecione uma plantação</strong><p>Escolha uma propriedade antes de configurar alertas.</p></main>;
  if (status === "loading") return <main className={styles.state}><span className={styles.spinner} /><strong>Carregando configurações</strong></main>;
  if (status === "error" || !settings) return <main className={styles.state}><DashboardIcon name="alert" /><strong>Configurações indisponíveis</strong><p>Não foi possível consultar as regras desta plantação.</p></main>;

  const readOnly = selectedPlantation.role !== "OWNER";
  return (
    <main className={styles.page}>
      <header className={styles.heading}>
        <div><p>MONITORAMENTO</p><h1>Configuração de alertas</h1><span>Defina regras específicas para {selectedPlantation.name}.</span></div>
        <div className={styles.statusBadge}><i /><span><small>REGRAS AGRONÔMICAS</small><strong>{[settings.moistureEnabled, settings.temperatureEnabled, settings.phEnabled].filter(Boolean).length} de 3 ativas</strong></span></div>
      </header>

      <div className={styles.notice}><DashboardIcon name="alert" size={20} /><div><strong>Nenhum limite agronômico é aplicado automaticamente.</strong><p>Ative uma regra somente depois de validar os valores para a cultura e as condições desta plantação.</p></div></div>
      {readOnly && <div className={styles.readOnly}>Seu perfil pode consultar estas regras, mas somente o proprietário pode alterá-las.</div>}

      <form onSubmit={handleSubmit}>
        <section className={styles.section}>
          <div className={styles.sectionTitle}><p>REGRAS OPERACIONAIS</p><h2>Disponibilidade e energia</h2></div>
          <div className={styles.grid}>
            <RuleCard title="Sensor sem dados" description="Alerta quando um dispositivo cadastrado ainda não enviou nenhuma leitura." enabled={settings.noDataEnabled} disabled={readOnly || saving} onToggle={(value) => update("noDataEnabled", value)} />
            <RuleCard title="Sensor offline" description="Considera o dispositivo offline depois do período sem novas leituras." enabled={settings.offlineEnabled} disabled={readOnly || saving} onToggle={(value) => update("offlineEnabled", value)}>
              <NumberField label="Tempo sem leitura" unit="min" value={settings.offlineAfterMinutes} min={1} max={1440} step={1} disabled={readOnly || saving || !settings.offlineEnabled} onChange={(value) => update("offlineAfterMinutes", value)} />
            </RuleCard>
            <RuleCard title="Bateria baixa" description="Alerta somente quando a carga estiver abaixo do limite e o sensor não estiver carregando." enabled={settings.lowBatteryEnabled} disabled={readOnly || saving} onToggle={(value) => update("lowBatteryEnabled", value)}>
              <NumberField label="Carga mínima" unit="%" value={settings.lowBatteryPercentage} min={0} max={100} step={1} disabled={readOnly || saving || !settings.lowBatteryEnabled} onChange={(value) => update("lowBatteryPercentage", value)} />
            </RuleCard>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionTitle}><p>REGRAS AGRONÔMICAS</p><h2>Faixas personalizadas</h2></div>
          <div className={styles.grid}>
            {rangeCards.map((card) => {
              const enabledKey = `${card.key}Enabled` as keyof AlertSettings;
              const minKey = `${card.key}Min` as keyof AlertSettings;
              const maxKey = `${card.key}Max` as keyof AlertSettings;
              const enabled = settings[enabledKey] as boolean;
              return <RuleCard key={card.key} title={card.title} description={card.description} enabled={enabled} disabled={readOnly || saving} onToggle={(value) => update(enabledKey, value)}>
                <div className={styles.rangeFields}>
                  <NumberField label="Mínimo" unit={card.unit} value={settings[minKey] as number | null} min={card.min} max={card.max} step={card.step} disabled={readOnly || saving || !enabled} onChange={(value) => update(minKey, value)} />
                  <NumberField label="Máximo" unit={card.unit} value={settings[maxKey] as number | null} min={card.min} max={card.max} step={card.step} disabled={readOnly || saving || !enabled} onChange={(value) => update(maxKey, value)} />
                </div>
              </RuleCard>;
            })}
          </div>
        </section>

        {message && <div className={message.tone === "success" ? styles.success : styles.error}>{message.text}</div>}
        {!readOnly && <div className={styles.actions}><button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar configurações"}</button></div>}
      </form>
    </main>
  );
}

function RuleCard({ title, description, enabled, disabled, onToggle, children }: { title: string; description: string; enabled: boolean; disabled: boolean; onToggle: (value: boolean) => void; children?: React.ReactNode }) {
  return <article className={`${styles.card} ${enabled ? styles.cardEnabled : ""}`}><div className={styles.cardHead}><div><h3>{title}</h3><p>{description}</p></div><label className={styles.switch}><input type="checkbox" checked={enabled} disabled={disabled} onChange={(event) => onToggle(event.target.checked)} /><span /></label></div>{children && <div className={styles.cardFields}>{children}</div>}</article>;
}

function NumberField({ label, unit, value, min, max, step, disabled, onChange }: { label: string; unit: string; value: number | null; min: number; max: number; step: number; disabled: boolean; onChange: (value: number) => void }) {
  return <label className={styles.numberField}><span>{label}</span><div><input type="number" value={value ?? ""} min={min} max={max} step={step} disabled={disabled} required={!disabled} onChange={(event) => onChange(Number(event.target.value))} /><b>{unit}</b></div></label>;
}
