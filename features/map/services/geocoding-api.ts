import type { GeocodingResult } from "../types/geocoding.types";

const GEOCODING_URL = process.env.NEXT_PUBLIC_GEOCODING_URL ?? "https://nominatim.openstreetmap.org/search";
const cache = new Map<string, GeocodingResult[]>();
let lastRequestAt = 0;

type NominatimResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
};

export async function searchLocations(query: string): Promise<GeocodingResult[]> {
  const normalized = query.trim().toLocaleLowerCase("pt-BR");
  if (normalized.length < 3) return [];
  const cached = cache.get(normalized);
  if (cached) return cached;

  const waitTime = Math.max(0, 1_000 - (Date.now() - lastRequestAt));
  if (waitTime) await new Promise((resolve) => window.setTimeout(resolve, waitTime));
  lastRequestAt = Date.now();

  const url = new URL(GEOCODING_URL);
  url.searchParams.set("q", query.trim());
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("countrycodes", "br");
  url.searchParams.set("accept-language", "pt-BR");
  url.searchParams.set("limit", "5");

  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("Serviço de localização indisponível.");
  const payload = await response.json() as NominatimResult[];
  const results = payload.map((item) => ({
    id: item.place_id,
    label: item.display_name,
    latitude: Number(item.lat),
    longitude: Number(item.lon),
  })).filter((item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude));
  cache.set(normalized, results);
  return results;
}
