"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/features/auth";
import * as plantationsApi from "../services/plantations-api";
import type { CreatePlantationInput, Plantation, PlantationsStatus } from "../types/plantation.types";

const ACTIVE_PLANTATION_KEY = "techsoil:active-plantation";

type PlantationContextValue = {
  plantations: Plantation[];
  selectedPlantation: Plantation | null;
  status: PlantationsStatus;
  selectPlantation: (plantationId: string) => void;
  createPlantation: (input: CreatePlantationInput) => Promise<Plantation>;
  reloadPlantations: () => Promise<void>;
};

const PlantationContext = createContext<PlantationContextValue | null>(null);

export function PlantationProvider({ children }: { children: React.ReactNode }) {
  const { status: authStatus } = useAuth();
  const [plantations, setPlantations] = useState<Plantation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState<PlantationsStatus>("idle");

  const applyPlantations = useCallback((items: Plantation[]) => {
    setPlantations(items);
    setSelectedId((current) => {
      const stored = window.localStorage.getItem(ACTIVE_PLANTATION_KEY);
      const next = [current, stored].find((id) => id && items.some((item) => item.id === id)) ?? items[0]?.id ?? null;

      if (next) window.localStorage.setItem(ACTIVE_PLANTATION_KEY, next);
      else window.localStorage.removeItem(ACTIVE_PLANTATION_KEY);
      return next;
    });
  }, []);

  const reloadPlantations = useCallback(async () => {
    setStatus("loading");
    try {
      applyPlantations(await plantationsApi.listPlantations());
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [applyPlantations]);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    const loadTimer = window.setTimeout(() => void reloadPlantations(), 0);
    return () => window.clearTimeout(loadTimer);
  }, [authStatus, reloadPlantations]);

  const selectPlantation = useCallback((plantationId: string) => {
    if (!plantations.some((plantation) => plantation.id === plantationId)) return;
    setSelectedId(plantationId);
    window.localStorage.setItem(ACTIVE_PLANTATION_KEY, plantationId);
  }, [plantations]);

  const createPlantation = useCallback(async (input: CreatePlantationInput) => {
    const created = await plantationsApi.createPlantation(input);
    setPlantations((current) => [...current, created]);
    setSelectedId(created.id);
    window.localStorage.setItem(ACTIVE_PLANTATION_KEY, created.id);
    setStatus("ready");
    return created;
  }, []);

  const selectedPlantation = plantations.find((plantation) => plantation.id === selectedId) ?? null;
  const value = useMemo(() => ({
    plantations,
    selectedPlantation,
    status,
    selectPlantation,
    createPlantation,
    reloadPlantations,
  }), [createPlantation, plantations, reloadPlantations, selectPlantation, selectedPlantation, status]);

  return <PlantationContext.Provider value={value}>{children}</PlantationContext.Provider>;
}

export function usePlantations() {
  const context = useContext(PlantationContext);
  if (!context) throw new Error("usePlantations deve ser usado dentro de PlantationProvider");
  return context;
}
