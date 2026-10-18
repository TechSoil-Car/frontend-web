"use client";

import { useCallback, useEffect, useState } from "react";
import { errorMessage } from "@/shared/api/error-message";
import * as plotsApi from "../services/plantation-plots-api";
import type {
  CreatePlantationPlotInput,
  PlantationPlot,
  PlantationPlotsStatus,
  UpdatePlantationPlotInput,
} from "../types/plantation-plot.types";

export function usePlantationPlots(plantationId: string | undefined) {
  const [plots, setPlots] = useState<PlantationPlot[]>([]);
  const [status, setStatus] = useState<PlantationPlotsStatus>(
    plantationId ? "loading" : "idle",
  );
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!plantationId) return;
    setStatus("loading");
    setError(null);
    try {
      setPlots(await plotsApi.listPlantationPlots(plantationId));
      setStatus("ready");
    } catch (requestError) {
      setError(
        errorMessage(requestError, "Não foi possível carregar os talhões."),
      );
      setStatus("error");
    }
  }, [plantationId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void reload(), 0);
    return () => window.clearTimeout(timer);
  }, [reload]);

  const createPlot = useCallback(
    async (input: CreatePlantationPlotInput) => {
      if (!plantationId) throw new Error("Selecione uma plantação.");
      const created = await plotsApi.createPlantationPlot(plantationId, input);
      setPlots((current) => [...current, created]);
      return created;
    },
    [plantationId],
  );

  const updatePlot = useCallback(
    async (plotId: string, input: UpdatePlantationPlotInput) => {
      if (!plantationId) throw new Error("Selecione uma plantação.");
      const updated = await plotsApi.updatePlantationPlot(
        plantationId,
        plotId,
        input,
      );
      setPlots((current) =>
        current.map((plot) => (plot.id === plotId ? updated : plot)),
      );
      return updated;
    },
    [plantationId],
  );

  const deletePlot = useCallback(
    async (plotId: string) => {
      if (!plantationId) return;
      await plotsApi.deletePlantationPlot(plantationId, plotId);
      setPlots((current) => current.filter((plot) => plot.id !== plotId));
    },
    [plantationId],
  );

  return { plots, status, error, reload, createPlot, updatePlot, deletePlot };
}
