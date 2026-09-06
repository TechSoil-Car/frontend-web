import type { MapPoint, PlantationRow } from "../types/plantation-row.types";
import { hasCoordinates } from "../types/plantation-row.types";

const EARTH_RADIUS_METERS = 6_371_000;

function toRadians(value: number) {
  return value * Math.PI / 180;
}

export function distanceInMeters(start: MapPoint, end: MapPoint) {
  const latitudeDelta = toRadians(end.latitude - start.latitude);
  const longitudeDelta = toRadians(end.longitude - start.longitude);
  const startLatitude = toRadians(start.latitude);
  const endLatitude = toRadians(end.latitude);
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(startLatitude) * Math.cos(endLatitude) * Math.sin(longitudeDelta / 2) ** 2;

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(haversine));
}

export function rowLength(row: PlantationRow) {
  if (!hasCoordinates(row)) return 0;
  return distanceInMeters(
    { latitude: row.startLatitude, longitude: row.startLongitude },
    { latitude: row.endLatitude, longitude: row.endLongitude },
  );
}

export function formatDistance(meters: number) {
  if (meters >= 1_000) return `${(meters / 1_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km`;
  return `${Math.round(meters).toLocaleString("pt-BR")} m`;
}

export function polygonAreaHectares(points: MapPoint[]) {
  if (points.length < 3) return 0;
  const ring = [...points, points[0]];
  let sum = 0;
  for (let index = 0; index < ring.length - 1; index += 1) {
    const first = ring[index];
    const second = ring[index + 1];
    sum += toRadians(second.longitude - first.longitude)
      * (2 + Math.sin(toRadians(first.latitude)) + Math.sin(toRadians(second.latitude)));
  }
  return Math.abs(sum) * EARTH_RADIUS_METERS ** 2 / 2 / 10_000;
}
