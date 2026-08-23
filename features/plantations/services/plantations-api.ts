import { apiRequest } from "@/shared/api/api-client";
import type { CreatePlantationInput, Plantation } from "../types/plantation.types";

export function listPlantations() {
  return apiRequest<Plantation[]>("/plantations");
}

export function createPlantation(input: CreatePlantationInput) {
  return apiRequest<Plantation>("/plantations", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
