"use client";

import { useEffect, useRef } from "react";
import { GeoJSONSource, LngLatBounds, Map, Marker, NavigationControl, setWorkerUrl } from "maplibre-gl";
import type { FeatureCollection } from "geojson";
import type { BoundaryPolygon } from "@/features/plantations";
import type { SensorAlert, SensorLatest } from "@/features/sensors/types/sensor.types";
import { SATELLITE_LAYER, SATELLITE_SOURCE, satelliteSource } from "../../utils/satellite";
import { sensorCoordinates, sensorMapStatus } from "../../utils/sensor-map";
import styles from "./PlantationSnapshot.module.css";

const BOUNDARY_SOURCE = "techsoil-snapshot-boundary";

type Props = {
  center: { latitude: number; longitude: number };
  zoom: number;
  boundary: BoundaryPolygon | null;
  sensors: SensorLatest[];
  alerts: SensorAlert[];
  selectedSensorId: string | null;
  onSelectSensor: (deviceId: string) => void;
};

function boundaryData(boundary: BoundaryPolygon | null): FeatureCollection {
  return { type: "FeatureCollection", features: boundary ? [{ type: "Feature", properties: {}, geometry: boundary }] : [] };
}

/** Satellite view of the plantation with sensors at their reported GPS positions. */
export function PlantationSnapshot({ center, zoom, boundary, sensors, alerts, selectedSensorId, onSelectSensor }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const onSelectRef = useRef(onSelectSensor);
  useEffect(() => { onSelectRef.current = onSelectSensor; }, [onSelectSensor]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
    const map = new Map({
      container: containerRef.current,
      style: { version: 8, sources: { [SATELLITE_SOURCE]: satelliteSource }, layers: [{ id: SATELLITE_LAYER, type: "raster", source: SATELLITE_SOURCE }] },
      center: [center.longitude, center.latitude],
      zoom,
      // Ctrl/⌘ + scroll (two fingers on touch) zooms, so the page still scrolls normally.
      cooperativeGestures: true,
      locale: {
        "CooperativeGesturesHandler.WindowsHelpText": "Use Ctrl + rolagem para aproximar o mapa",
        "CooperativeGesturesHandler.MacHelpText": "Use ⌘ + rolagem para aproximar o mapa",
        "CooperativeGesturesHandler.MobileHelpText": "Use dois dedos para mover o mapa",
        "NavigationControl.ZoomIn": "Aproximar",
        "NavigationControl.ZoomOut": "Afastar",
      },
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    map.addControl(new NavigationControl({ showCompass: false }), "bottom-right");
    map.on("load", () => {
      map.addSource(BOUNDARY_SOURCE, { type: "geojson", data: boundaryData(null) });
      map.addLayer({ id: "techsoil-snapshot-boundary-line", type: "line", source: BOUNDARY_SOURCE, layout: { "line-join": "round" }, paint: { "line-color": "#dfff9e", "line-width": 2.5 } });
    });
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // The map is created once; later changes are applied by the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      (map.getSource(BOUNDARY_SOURCE) as GeoJSONSource | undefined)?.setData(boundaryData(boundary));
      const ring = boundary?.coordinates[0];
      if (ring?.length) {
        const bounds = new LngLatBounds();
        ring.forEach(([longitude, latitude]) => bounds.extend([longitude, latitude]));
        map.fitBounds(bounds, { padding: 40, maxZoom: 18, duration: 0 });
      } else {
        map.jumpTo({ center: [center.longitude, center.latitude], zoom });
      }
    };
    if (map.getSource(BOUNDARY_SOURCE)) apply();
    else map.once("load", apply);
    return () => { map.off("load", apply); };
  }, [boundary, center.latitude, center.longitude, zoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const markers = sensors.flatMap((sensor) => {
      const coordinates = sensorCoordinates(sensor);
      if (!coordinates) return [];
      const state = sensorMapStatus(sensor, alerts);
      const button = document.createElement("button");
      button.type = "button";
      button.className = `${styles.marker} ${styles[state.key]} ${sensor.device.id === selectedSensorId ? styles.selected : ""}`;
      button.setAttribute("aria-label", `Selecionar ${sensor.device.name}: ${state.label}`);
      button.title = `${sensor.device.name} · ${state.label}`;
      button.addEventListener("click", () => onSelectRef.current(sensor.device.id));
      return [new Marker({ element: button }).setLngLat(coordinates).addTo(map)];
    });
    return () => markers.forEach((marker) => marker.remove());
  }, [sensors, alerts, selectedSensorId]);

  return <div className={styles.snapshot} ref={containerRef} aria-label="Imagem de satélite da plantação com os sensores" />;
}
