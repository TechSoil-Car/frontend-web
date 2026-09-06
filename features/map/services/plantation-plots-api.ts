import { apiRequest } from "@/shared/api/api-client";
import type {
  CreatePlantationPlotInput,
  PlantationPlot,
  UpdatePlantationPlotInput,
} from "../types/plantation-plot.types";

export function listPlantationPlots(plantationId: string) {
  return apiRequest<PlantationPlot[]>(`/plantations/${plantationId}/plots`);
}

export function createPlantationPlot(
  plantationId: string,
  input: CreatePlantationPlotInput,
) {
  return apiRequest<PlantationPlot>(`/plantations/${plantationId}/plots`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updatePlantationPlot(
  plantationId: string,
  plotId: string,
  input: UpdatePlantationPlotInput,
) {
  return apiRequest<PlantationPlot>(
    `/plantations/${plantationId}/plots/${plotId}`,
    { method: "PATCH", body: JSON.stringify(input) },
  );
}

export function deletePlantationPlot(plantationId: string, plotId: string) {
  return apiRequest<void>(`/plantations/${plantationId}/plots/${plotId}`, {
    method: "DELETE",
  });
}
