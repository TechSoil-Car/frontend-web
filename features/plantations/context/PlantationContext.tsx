"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "@/features/auth";
import { useOrganizations } from "@/features/organizations/context/OrganizationContext";
import * as plantationsApi from "../services/plantations-api";
import type {
  CreatePlantationInput,
  Plantation,
  PlantationsStatus,
  UpdatePlantationInput,
  UpdatePlantationMapInput,
} from "../types/plantation.types";

const ACTIVE_PLANTATION_KEY = "techsoil:active-plantation";

type PlantationContextValue = {
  plantations: Plantation[];
  selectedPlantation: Plantation | null;
  status: PlantationsStatus;
  selectPlantation: (plantationId: string) => void;
  createPlantation: (input: CreatePlantationInput) => Promise<Plantation>;
  updatePlantation: (
    id: string,
    input: UpdatePlantationInput,
  ) => Promise<Plantation>;
  removePlantation: (id: string) => Promise<void>;
  updatePlantationMap: (input: UpdatePlantationMapInput) => Promise<Plantation>;
  reloadPlantations: () => Promise<void>;
};

const PlantationContext = createContext<PlantationContextValue | null>(null);

const adminPlantationContext: PlantationContextValue = {
  plantations: [],
  selectedPlantation: null,
  status: "ready",
  selectPlantation: () => {},
  createPlantation: () =>
    Promise.reject(
      new Error("Superadmin não pode criar uma plantação própria."),
    ),
  updatePlantationMap: () =>
    Promise.reject(new Error("Superadmin não possui acesso operacional.")),
  updatePlantation: () =>
    Promise.reject(new Error("Superadmin não possui acesso operacional.")),
  removePlantation: () =>
    Promise.reject(new Error("Superadmin não possui acesso operacional.")),
  reloadPlantations: () => Promise.resolve(),
};

export function PlantationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const { selected, status: organizationStatus } = useOrganizations();
  const isAdmin = user?.systemRole === "SUPERADMIN";
  useEffect(() => {
    if (isAdmin) window.localStorage.removeItem(ACTIVE_PLANTATION_KEY);
  }, [isAdmin]);
  if (isAdmin)
    return (
      <PlantationContext.Provider value={adminPlantationContext}>
        {children}
      </PlantationContext.Provider>
    );
  if (organizationStatus !== "ready")
    return (
      <PlantationContext.Provider value={{ ...adminPlantationContext, status: organizationStatus === "error" ? "error" : "loading" }}>
        {children}
      </PlantationContext.Provider>
    );
  return (
    <OperationalPlantationProvider key={`${selected?.organization.id ?? "none"}:${organizationStatus}`} organizationId={selected?.organization.id ?? null}>{children}</OperationalPlantationProvider>
  );
}

function OperationalPlantationProvider({
  children,
  organizationId,
}: {
  children: React.ReactNode;
  organizationId: string | null;
}) {
  const { status: authStatus } = useAuth();
  const [plantations, setPlantations] = useState<Plantation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState<PlantationsStatus>("idle");

  const applyPlantations = useCallback((items: Plantation[]) => {
    setPlantations(items);
    setSelectedId((current) => {
      const stored = window.localStorage.getItem(ACTIVE_PLANTATION_KEY);
      const next =
        [current, stored].find(
          (id) => id && items.some((item) => item.id === id),
        ) ??
        items[0]?.id ??
        null;

      if (next) window.localStorage.setItem(ACTIVE_PLANTATION_KEY, next);
      else window.localStorage.removeItem(ACTIVE_PLANTATION_KEY);
      return next;
    });
  }, []);

  const reloadPlantations = useCallback(async () => {
    setStatus("loading");
    try {
      const items = await plantationsApi.listPlantations();
      applyPlantations(items.filter(item => item.organizationId === organizationId));
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [applyPlantations, organizationId]);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    const loadTimer = window.setTimeout(() => void reloadPlantations(), 0);
    return () => window.clearTimeout(loadTimer);
  }, [authStatus, reloadPlantations]);

  const selectPlantation = useCallback(
    (plantationId: string) => {
      if (!plantations.some((plantation) => plantation.id === plantationId))
        return;
      setSelectedId(plantationId);
      window.localStorage.setItem(ACTIVE_PLANTATION_KEY, plantationId);
    },
    [plantations],
  );

  const createPlantation = useCallback(async (input: CreatePlantationInput) => {
    const created = await plantationsApi.createPlantation(input);
    setPlantations((current) => [...current, created]);
    setSelectedId(created.id);
    window.localStorage.setItem(ACTIVE_PLANTATION_KEY, created.id);
    setStatus("ready");
    return created;
  }, []);

  const updatePlantationMap = useCallback(
    async (input: UpdatePlantationMapInput) => {
      if (!selectedId)
        throw new Error("Selecione uma plantação antes de atualizar o mapa.");
      const updated = await plantationsApi.updatePlantationMap(
        selectedId,
        input,
      );
      setPlantations((current) =>
        current.map((plantation) =>
          plantation.id === updated.id ? updated : plantation,
        ),
      );
      return updated;
    },
    [selectedId],
  );

  const updatePlantation = useCallback(
    async (id: string, input: UpdatePlantationInput) => {
      const updated = await plantationsApi.updatePlantation(id, input);
      setPlantations((current) =>
        current.map((item) => (item.id === id ? updated : item)),
      );
      return updated;
    },
    [],
  );

  const removePlantation = useCallback(
    async (id: string) => {
      await plantationsApi.removePlantation(id);
      setPlantations((current) => current.filter((item) => item.id !== id));
      setSelectedId((current) => {
        if (current !== id) return current;
        const next = plantations.find((item) => item.id !== id)?.id ?? null;
        if (next) window.localStorage.setItem(ACTIVE_PLANTATION_KEY, next);
        else window.localStorage.removeItem(ACTIVE_PLANTATION_KEY);
        return next;
      });
    },
    [plantations],
  );

  const selectedPlantation =
    plantations.find((plantation) => plantation.id === selectedId) ?? null;
  const value = useMemo(
    () => ({
      plantations,
      selectedPlantation,
      status,
      selectPlantation,
      createPlantation,
      updatePlantation,
      removePlantation,
      updatePlantationMap,
      reloadPlantations,
    }),
    [
      createPlantation,
      updatePlantation,
      removePlantation,
      plantations,
      reloadPlantations,
      selectPlantation,
      selectedPlantation,
      status,
      updatePlantationMap,
    ],
  );

  return (
    <PlantationContext.Provider value={value}>
      {children}
    </PlantationContext.Provider>
  );
}

export function usePlantations() {
  const context = useContext(PlantationContext);
  if (!context)
    throw new Error(
      "usePlantations deve ser usado dentro de PlantationProvider",
    );
  return context;
}
