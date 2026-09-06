import { apiRequest } from "@/shared/api/api-client";
import type { CreatePlantationRowInput, PlantationRow } from "../types/plantation-row.types";

export function listPlantationRows(plantationId: string) {
  return apiRequest<PlantationRow[]>(`/plantations/${plantationId}/rows`);
}

export function createPlantationRow(plantationId: string, input: CreatePlantationRowInput) {
  return apiRequest<PlantationRow>(`/plantations/${plantationId}/rows`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function deletePlantationRow(plantationId: string, rowId: string) {
  return apiRequest<void>(`/plantations/${plantationId}/rows/${rowId}`, {
    method: "DELETE",
  });
}
