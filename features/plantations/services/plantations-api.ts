import { apiRequest } from "@/shared/api/api-client";
import type {
  CreatePlantationInput,
  Plantation,
  UpdatePlantationInput,
  UpdatePlantationMapInput,
} from "../types/plantation.types";

export function listPlantations() {
  return apiRequest<Plantation[]>("/plantations");
}

export function createPlantation(input: CreatePlantationInput) {
  return apiRequest<Plantation>("/plantations", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updatePlantationMap(
  plantationId: string,
  input: UpdatePlantationMapInput,
) {
  return apiRequest<Plantation>(`/plantations/${plantationId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function updatePlantation(
  plantationId: string,
  input: UpdatePlantationInput,
) {
  return apiRequest<Plantation>(
    `/plantations/${encodeURIComponent(plantationId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
}

export function removePlantation(plantationId: string) {
  return apiRequest<void>(`/plantations/${encodeURIComponent(plantationId)}`, {
    method: "DELETE",
  });
}
