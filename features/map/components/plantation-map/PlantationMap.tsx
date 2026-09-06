"use client";

import { useEffect, useRef } from "react";
import type { Feature, FeatureCollection, LineString, Point } from "geojson";
import {
  GeoJSONSource,
  LngLatBounds,
  Map,
  NavigationControl,
  ScaleControl,
  setWorkerUrl,
} from "maplibre-gl";
import type { MapLayerMouseEvent } from "maplibre-gl";
import type { MapPoint, PlantationRow } from "../../types/plantation-row.types";
import { hasCoordinates } from "../../types/plantation-row.types";
import styles from "./PlantationMap.module.css";

const ROWS_SOURCE = "techsoil-rows";
const ROWS_LAYER = "techsoil-rows-line";
const ROWS_HITBOX_LAYER = "techsoil-rows-hitbox";
const ENDPOINTS_SOURCE = "techsoil-row-endpoints";
const DRAFT_SOURCE = "techsoil-row-draft";
const DEFAULT_CENTER: [number, number] = [-47.0608, -22.9056];
const STYLE_URL = process.env.NEXT_PUBLIC_MAP_STYLE_URL ?? "https://tiles.openfreemap.org/styles/liberty";

type PlantationMapProps = {
  rows: PlantationRow[];
  selectedRowId: string | null;
  draftStart: MapPoint | null;
  draftEnd: MapPoint | null;
  drawing: boolean;
  onMapClick: (point: MapPoint) => void;
  onSelectRow: (rowId: string) => void;
};

function rowsGeoJson(rows: PlantationRow[], selectedRowId: string | null): FeatureCollection<LineString> {
  return {
    type: "FeatureCollection",
    features: rows.filter(hasCoordinates).map((row) => ({
      type: "Feature",
      id: row.id,
      properties: { rowId: row.id, rowNumber: row.rowNumber, selected: row.id === selectedRowId },
      geometry: {
        type: "LineString",
        coordinates: [[row.startLongitude, row.startLatitude], [row.endLongitude, row.endLatitude]],
      },
    })),
  };
}

function endpointsGeoJson(rows: PlantationRow[]): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: rows.filter(hasCoordinates).flatMap((row) => [
      { type: "Feature" as const, properties: { rowId: row.id }, geometry: { type: "Point" as const, coordinates: [row.startLongitude, row.startLatitude] } },
      { type: "Feature" as const, properties: { rowId: row.id }, geometry: { type: "Point" as const, coordinates: [row.endLongitude, row.endLatitude] } },
    ]),
  };
}

function draftGeoJson(start: MapPoint | null, end: MapPoint | null): FeatureCollection {
  const points = [start, end].filter((point): point is MapPoint => Boolean(point));
  const features: Feature[] = points.map((point, index) => ({
    type: "Feature",
    properties: { kind: index === 0 ? "start" : "end" },
    geometry: { type: "Point", coordinates: [point.longitude, point.latitude] },
  }));

  if (start && end) {
    features.unshift({
      type: "Feature",
      properties: { kind: "line" },
      geometry: { type: "LineString", coordinates: [[start.longitude, start.latitude], [end.longitude, end.latitude]] },
    });
  }

  return { type: "FeatureCollection", features };
}

export function PlantationMap({ rows, selectedRowId, draftStart, draftEnd, drawing, onMapClick, onSelectRow }: PlantationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const onMapClickRef = useRef(onMapClick);
  const onSelectRowRef = useRef(onSelectRow);
  const drawingRef = useRef(drawing);
  const fittedRowsRef = useRef("");

  useEffect(() => { onMapClickRef.current = onMapClick; }, [onMapClick]);
  useEffect(() => { onSelectRowRef.current = onSelectRow; }, [onSelectRow]);
  useEffect(() => {
    drawingRef.current = drawing;
    if (mapRef.current) mapRef.current.getCanvas().style.cursor = drawing ? "crosshair" : "grab";
  }, [drawing]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

    const map = new Map({
      container: containerRef.current,
      style: STYLE_URL,
      center: DEFAULT_CENTER,
      zoom: 13,
      maplibreLogo: true,
    });
    mapRef.current = map;
    map.addControl(new NavigationControl({ visualizePitch: true }), "top-right");
    map.addControl(new ScaleControl({ unit: "metric", maxWidth: 110 }), "bottom-right");

    map.on("load", () => {
      map.addSource(ROWS_SOURCE, { type: "geojson", data: rowsGeoJson([], null) });
      map.addLayer({ id: ROWS_HITBOX_LAYER, type: "line", source: ROWS_SOURCE, paint: { "line-color": "rgba(0,0,0,0)", "line-width": 22 } });
      map.addLayer({
        id: ROWS_LAYER,
        type: "line",
        source: ROWS_SOURCE,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": ["case", ["boolean", ["get", "selected"], false], "#dfff9e", "#86c85d"],
          "line-width": ["case", ["boolean", ["get", "selected"], false], 7, 4],
          "line-opacity": 0.96,
        },
      });
      map.addSource(ENDPOINTS_SOURCE, { type: "geojson", data: endpointsGeoJson([]) });
      map.addLayer({
        id: "techsoil-row-endpoints-circle",
        type: "circle",
        source: ENDPOINTS_SOURCE,
        paint: { "circle-radius": 4.5, "circle-color": "#173b26", "circle-stroke-color": "#dfff9e", "circle-stroke-width": 2 },
      });
      map.addSource(DRAFT_SOURCE, { type: "geojson", data: draftGeoJson(null, null) });
      map.addLayer({
        id: "techsoil-row-draft-line",
        type: "line",
        source: DRAFT_SOURCE,
        filter: ["==", ["geometry-type"], "LineString"],
        layout: { "line-cap": "round" },
        paint: { "line-color": "#f0b75d", "line-width": 5, "line-dasharray": [1.5, 1.5] },
      });
      map.addLayer({
        id: "techsoil-row-draft-points",
        type: "circle",
        source: DRAFT_SOURCE,
        filter: ["==", ["geometry-type"], "Point"],
        paint: { "circle-radius": 7, "circle-color": "#f0b75d", "circle-stroke-color": "#fff", "circle-stroke-width": 3 },
      });
    });

    map.on("click", (event: MapLayerMouseEvent) => {
      if (drawingRef.current) {
        onMapClickRef.current({ latitude: event.lngLat.lat, longitude: event.lngLat.lng });
        return;
      }
      const feature = map.queryRenderedFeatures(event.point, { layers: [ROWS_HITBOX_LAYER] })[0];
      const rowId = feature?.properties?.rowId;
      if (typeof rowId === "string") onSelectRowRef.current(rowId);
    });

    map.on("mousemove", (event: MapLayerMouseEvent) => {
      if (drawingRef.current) return;
      const feature = map.queryRenderedFeatures(event.point, { layers: [ROWS_HITBOX_LAYER] })[0];
      map.getCanvas().style.cursor = feature ? "pointer" : "grab";
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const updateSources = () => {
      (map.getSource(ROWS_SOURCE) as GeoJSONSource | undefined)?.setData(rowsGeoJson(rows, selectedRowId));
      (map.getSource(ENDPOINTS_SOURCE) as GeoJSONSource | undefined)?.setData(endpointsGeoJson(rows));
      (map.getSource(DRAFT_SOURCE) as GeoJSONSource | undefined)?.setData(draftGeoJson(draftStart, draftEnd));
    };
    if (map.loaded()) updateSources();
    else map.once("load", updateSources);
  }, [draftEnd, draftStart, rows, selectedRowId]);

  useEffect(() => {
    const map = mapRef.current;
    const mappedRows = rows.filter(hasCoordinates);
    const rowsKey = mappedRows.map((row) => row.id).join(":");
    if (!map || !mappedRows.length || fittedRowsRef.current === rowsKey) return;
    fittedRowsRef.current = rowsKey;

    const bounds = new LngLatBounds();
    mappedRows.forEach((row) => {
      bounds.extend([row.startLongitude, row.startLatitude]);
      bounds.extend([row.endLongitude, row.endLatitude]);
    });
    map.fitBounds(bounds, { padding: 90, maxZoom: 17, duration: 800 });
  }, [rows]);

  useEffect(() => {
    const map = mapRef.current;
    const selected = rows.find((row) => row.id === selectedRowId);
    if (!map || !selected || !hasCoordinates(selected)) return;
    const bounds = new LngLatBounds(
      [selected.startLongitude, selected.startLatitude],
      [selected.startLongitude, selected.startLatitude],
    );
    bounds.extend([selected.endLongitude, selected.endLatitude]);
    map.fitBounds(bounds, { padding: 130, maxZoom: 18, duration: 650 });
  }, [rows, selectedRowId]);

  return <div className={styles.map} ref={containerRef} aria-label="Mapa interativo das linhas da plantação" />;
}
