export type PlantationRow = {
  id: string;
  rowNumber: number;
  plotId: string | null;
  startLatitude: number | null;
  startLongitude: number | null;
  endLatitude: number | null;
  endLongitude: number | null;
  plantationId: string;
  createdAt: string;
  updatedAt: string;
};

export type RowCoordinates = {
  startLatitude: number;
  startLongitude: number;
  endLatitude: number;
  endLongitude: number;
};

export type CreatePlantationRowInput = RowCoordinates & {
  rowNumber: number;
  plotId?: string;
};

export type MapPoint = {
  latitude: number;
  longitude: number;
};

export type PlantationRowsStatus = "idle" | "loading" | "ready" | "error";

export function hasCoordinates(row: PlantationRow): row is PlantationRow & RowCoordinates {
  return row.startLatitude !== null
    && row.startLongitude !== null
    && row.endLatitude !== null
    && row.endLongitude !== null;
}
