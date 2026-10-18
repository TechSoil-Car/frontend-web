import type { BoundaryPolygon } from "@/features/plantations/types/plantation.types";

export type PlantationPlot = {
  id: string;
  name: string;
  color: string;
  boundaryGeoJson: BoundaryPolygon;
  areaHectares: number;
  plantationId: string;
  createdAt: string;
  updatedAt: string;
};

export type CreatePlantationPlotInput = {
  name: string;
  color: string;
  boundaryGeoJson: BoundaryPolygon;
};

export type UpdatePlantationPlotInput = Partial<CreatePlantationPlotInput>;

export type PlantationPlotsStatus = "idle" | "loading" | "ready" | "error";
