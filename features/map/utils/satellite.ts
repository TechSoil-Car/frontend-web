import type { Map, RasterSourceSpecification } from "maplibre-gl";

// Esri World Imagery works without a key for development. Production use
// requires an ArcGIS Location Platform account; replace the URL via env.
export const SATELLITE_TILES_URL =
  process.env.NEXT_PUBLIC_SATELLITE_TILES_URL ??
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

export const SATELLITE_SOURCE = "techsoil-satellite";
export const SATELLITE_LAYER = "techsoil-satellite-imagery";

export const satelliteSource: RasterSourceSpecification = {
  type: "raster",
  tiles: [SATELLITE_TILES_URL],
  tileSize: 256,
  maxzoom: 19,
  attribution:
    "Imagens © Esri, Maxar, Earthstar Geographics e comunidade GIS · Powered by Esri",
};

/** Adds the imagery above the base style and below everything added afterwards. */
export function addSatelliteLayer(map: Map, visible: boolean) {
  map.addSource(SATELLITE_SOURCE, satelliteSource);
  map.addLayer({
    id: SATELLITE_LAYER,
    type: "raster",
    source: SATELLITE_SOURCE,
    layout: { visibility: visible ? "visible" : "none" },
  });
}
