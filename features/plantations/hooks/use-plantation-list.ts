"use client";

import { useMemo, useState } from "react";
import type { Plantation, PlantationRole } from "../types/plantation.types";

export type PlantationFilter = "all" | PlantationRole | "shared";

export const plantationFilters: Array<{ label: string; value: PlantationFilter }> = [
  { label: "Todas", value: "all" },
  { label: "Administradas por mim", value: "OWNER" },
  { label: "Compartilhadas", value: "shared" },
];

/** Busca e filtro por acesso da lista de plantações, com as contagens do resumo. */
export function usePlantationList(plantations: Plantation[]) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<PlantationFilter>("all");

  const visiblePlantations = useMemo(
    () =>
      plantations.filter((plantation) => {
        const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
        const searchable =
          `${plantation.name} ${plantation.location ?? ""}`.toLocaleLowerCase(
            "pt-BR",
          );
        return (
          (filter === "all" || (filter === "shared" ? plantation.role !== "OWNER" : plantation.role === filter)) &&
          (!normalizedQuery || searchable.includes(normalizedQuery))
        );
      }),
    [filter, plantations, query],
  );

  const ownerCount = plantations.filter(
    (plantation) => plantation.role === "OWNER",
  ).length;
  const sharedCount = plantations.length - ownerCount;
  const locationCount = new Set(
    plantations.map((plantation) => plantation.location).filter(Boolean),
  ).size;

  return {
    query,
    setQuery,
    filter,
    setFilter,
    visiblePlantations,
    ownerCount,
    sharedCount,
    locationCount,
  };
}
