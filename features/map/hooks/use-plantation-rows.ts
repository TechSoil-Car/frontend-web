"use client";

import { useCallback, useEffect, useState } from "react";
import { errorMessage } from "@/shared/api/error-message";
import * as rowsApi from "../services/plantation-rows-api";
import type { CreatePlantationRowInput, PlantationRow, PlantationRowsStatus } from "../types/plantation-row.types";

export function usePlantationRows(plantationId: string | undefined) {
  const [rows, setRows] = useState<PlantationRow[]>([]);
  const [status, setStatus] = useState<PlantationRowsStatus>(plantationId ? "loading" : "idle");
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!plantationId) return;
    setStatus("loading");
    setError(null);

    try {
      setRows(await rowsApi.listPlantationRows(plantationId));
      setStatus("ready");
    } catch (requestError) {
      setError(errorMessage(requestError, "Não foi possível carregar as linhas desta plantação."));
      setStatus("error");
    }
  }, [plantationId]);

  useEffect(() => {
    if (!plantationId) return;

    const timer = window.setTimeout(() => void reload(), 0);
    return () => window.clearTimeout(timer);
  }, [plantationId, reload]);

  const createRow = useCallback(async (input: CreatePlantationRowInput) => {
    if (!plantationId) throw new Error("Selecione uma plantação antes de cadastrar uma linha.");
    const created = await rowsApi.createPlantationRow(plantationId, input);
    setRows((current) => [...current, created].sort((a, b) => a.rowNumber - b.rowNumber));
    return created;
  }, [plantationId]);

  const deleteRow = useCallback(async (rowId: string) => {
    if (!plantationId) return;
    await rowsApi.deletePlantationRow(plantationId, rowId);
    setRows((current) => current.filter((row) => row.id !== rowId));
  }, [plantationId]);

  return { rows, status, error, reload, createRow, deleteRow };
}
