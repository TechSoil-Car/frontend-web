export type PlantationRole = "OWNER" | "MEMBER";

export type BoundaryPolygon = {
  type: "Polygon";
  coordinates: number[][][];
};

export type Plantation = {
  id: string;
  name: string;
  location: string | null;
  centerLatitude: number | null;
  centerLongitude: number | null;
  mapZoom: number | null;
  boundaryGeoJson: BoundaryPolygon | null;
  areaHectares: number | null;
  createdAt: string;
  role: PlantationRole;
};

export type CreatePlantationInput = {
  name: string;
  location?: string;
};

export type UpdatePlantationInput = { name: string; location: string | null };

export type UpdatePlantationMapInput = {
  location: string;
  centerLatitude: number;
  centerLongitude: number;
  mapZoom: number;
  boundaryGeoJson: BoundaryPolygon;
};

export type PlantationsStatus = "idle" | "loading" | "ready" | "error";
