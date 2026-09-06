import { apiRequest } from "@/shared/api/api-client";
import type { CreatePlantationInput, Plantation, UpdatePlantationMapInput } from "../types/plantation.types";

export function listPlantations() {
  return apiRequest<Plantation[]>("/plantations");
}

export function createPlantation(input: CreatePlantationInput) {
  return apiRequest<Plantation>("/plantations", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updatePlantationMap(plantationId: string, input: UpdatePlantationMapInput) {
  return apiRequest<Plantation>(`/plantations/${plantationId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
