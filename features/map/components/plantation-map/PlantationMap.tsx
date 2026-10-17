"use client";

import { useEffect, useRef } from "react";
import type { Feature, FeatureCollection, LineString, Point } from "geojson";
import {
  GeoJSONSource,
  LngLatBounds,
  Map,
  Marker,
  Popup,
  NavigationControl,
  ScaleControl,
  setWorkerUrl,
} from "maplibre-gl";
import type { MapLayerMouseEvent } from "maplibre-gl";
import type { BoundaryPolygon } from "@/features/plantations";
import type { PlantationPlot } from "../../types/plantation-plot.types";
import type { MapPoint, PlantationRow } from "../../types/plantation-row.types";
import { hasCoordinates } from "../../types/plantation-row.types";
import type { SensorAlert, SensorLatest } from "@/features/sensors/types/sensor.types";
import { sensorCoordinates, sensorMapStatus } from "../../utils/sensor-map";
import { createSensorPopup } from "./sensor-popup";
import { popupPanOffset } from "../../utils/popup-pan";
import { SATELLITE_LAYER, addSatelliteLayer } from "../../utils/satellite";
import styles from "./PlantationMap.module.css";

const ROWS_SOURCE = "techsoil-rows";
const ROWS_LAYER = "techsoil-rows-line";
const ROWS_HITBOX_LAYER = "techsoil-rows-hitbox";
const ENDPOINTS_SOURCE = "techsoil-row-endpoints";
const DRAFT_SOURCE = "techsoil-row-draft";
const BOUNDARY_SOURCE = "techsoil-boundary";
const BOUNDARY_DRAFT_SOURCE = "techsoil-boundary-draft";
const PLOTS_SOURCE = "techsoil-plots";
const PLOTS_HITBOX_LAYER = "techsoil-plots-hitbox";
const PLOT_DRAFT_SOURCE = "techsoil-plot-draft";
const LOCATION_SOURCE = "techsoil-location";
const DEFAULT_CENTER: [number, number] = [-47.0608, -22.9056];
const STYLE_URL = process.env.NEXT_PUBLIC_MAP_STYLE_URL ?? "https://tiles.openfreemap.org/styles/liberty";

type PlantationMapProps = {
  sensors: SensorLatest[];
  alerts: SensorAlert[];
  sensorFocus: { coordinates: [number, number]; request: number } | null;
  rows: PlantationRow[];
  plots: PlantationPlot[];
  selectedPlotId: string | null;
  selectedRowId: string | null;
  draftStart: MapPoint | null;
  draftEnd: MapPoint | null;
  center: MapPoint | null;
  zoom: number;
  boundary: BoundaryPolygon | null;
  boundaryDraft: MapPoint[];
  plotDraft: MapPoint[];
  interactionMode: "row" | "boundary" | "plot" | null;
  basemap: "map" | "satellite";
  onMapClick: (point: MapPoint) => void;
  onSelectRow: (rowId: string) => void;
  onSelectPlot: (plotId: string) => void;
};

function plotsGeoJson(
  plots: PlantationPlot[],
  selectedPlotId: string | null,
): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: plots.map((plot) => ({
      type: "Feature",
      id: plot.id,
      properties: {
        plotId: plot.id,
        name: plot.name,
        color: plot.color,
        selected: plot.id === selectedPlotId,
      },
      geometry: plot.boundaryGeoJson,
    })),
  };
}

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

function boundaryGeoJson(boundary: BoundaryPolygon | null): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: boundary ? [{ type: "Feature", properties: {}, geometry: boundary }] : [],
  };
}

function boundaryDraftGeoJson(points: MapPoint[]): FeatureCollection {
  if (!points.length) return { type: "FeatureCollection", features: [] };
  const coordinates = points.map((point) => [point.longitude, point.latitude]);
  const features: Feature[] = [{ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates } }];
  points.forEach((point, index) => features.push({
    type: "Feature",
    properties: { index },
    geometry: { type: "Point", coordinates: [point.longitude, point.latitude] },
  }));
  if (points.length >= 3) {
    features.unshift({
      type: "Feature",
      properties: {},
      geometry: { type: "Polygon", coordinates: [[...coordinates, coordinates[0]]] },
    });
  }
  return { type: "FeatureCollection", features };
}

function locationGeoJson(center: MapPoint | null): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: center ? [{ type: "Feature", properties: {}, geometry: { type: "Point", coordinates: [center.longitude, center.latitude] } }] : [],
  };
}

export function PlantationMap({ sensors, alerts, sensorFocus, rows, plots, selectedRowId, selectedPlotId, draftStart, draftEnd, center, zoom, boundary, boundaryDraft, plotDraft, interactionMode, basemap, onMapClick, onSelectRow, onSelectPlot }: PlantationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const onMapClickRef = useRef(onMapClick);
  const onSelectRowRef = useRef(onSelectRow);
  const onSelectPlotRef = useRef(onSelectPlot);
  const interactionModeRef = useRef(interactionMode);
  const fittedRowsRef = useRef("");
  const basemapRef = useRef(basemap);

  useEffect(() => { onMapClickRef.current = onMapClick; }, [onMapClick]);
  useEffect(() => { onSelectRowRef.current = onSelectRow; }, [onSelectRow]);
  useEffect(() => { onSelectPlotRef.current = onSelectPlot; }, [onSelectPlot]);
  useEffect(() => {
    interactionModeRef.current = interactionMode;
    if (mapRef.current) mapRef.current.getCanvas().style.cursor = interactionMode ? "crosshair" : "grab";
  }, [interactionMode]);

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
      addSatelliteLayer(map, basemapRef.current === "satellite");
      map.addSource(ROWS_SOURCE, { type: "geojson", data: rowsGeoJson([], null) });
      map.addSource(BOUNDARY_SOURCE, { type: "geojson", data: boundaryGeoJson(null) });
      map.addLayer({ id: "techsoil-boundary-fill", type: "fill", source: BOUNDARY_SOURCE, paint: { "fill-color": "#79ae50", "fill-opacity": .18 } });
      map.addLayer({ id: "techsoil-boundary-line", type: "line", source: BOUNDARY_SOURCE, layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#416f35", "line-width": 3 } });
      map.addSource(PLOTS_SOURCE, { type: "geojson", data: plotsGeoJson([], null) });
      map.addLayer({ id: PLOTS_HITBOX_LAYER, type: "fill", source: PLOTS_SOURCE, paint: { "fill-color": "rgba(0,0,0,0)", "fill-opacity": 0 } });
      map.addLayer({ id: "techsoil-plots-fill", type: "fill", source: PLOTS_SOURCE, paint: { "fill-color": ["get", "color"], "fill-opacity": ["case", ["boolean", ["get", "selected"], false], .42, .25] } });
      map.addLayer({ id: "techsoil-plots-line", type: "line", source: PLOTS_SOURCE, layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": ["get", "color"], "line-width": ["case", ["boolean", ["get", "selected"], false], 5, 2.5], "line-opacity": .95 } });
      map.addSource(PLOT_DRAFT_SOURCE, { type: "geojson", data: boundaryDraftGeoJson([]) });
      map.addLayer({ id: "techsoil-plot-draft-fill", type: "fill", source: PLOT_DRAFT_SOURCE, filter: ["==", ["geometry-type"], "Polygon"], paint: { "fill-color": "#d99b45", "fill-opacity": .3 } });
      map.addLayer({ id: "techsoil-plot-draft-line", type: "line", source: PLOT_DRAFT_SOURCE, filter: ["==", ["geometry-type"], "LineString"], paint: { "line-color": "#d1802e", "line-width": 4, "line-dasharray": [1.3, 1.3] } });
      map.addLayer({ id: "techsoil-plot-draft-points", type: "circle", source: PLOT_DRAFT_SOURCE, filter: ["==", ["geometry-type"], "Point"], paint: { "circle-radius": 6, "circle-color": "#d99b45", "circle-stroke-color": "#fff", "circle-stroke-width": 2.5 } });
      map.addSource(BOUNDARY_DRAFT_SOURCE, { type: "geojson", data: boundaryDraftGeoJson([]) });
      map.addLayer({ id: "techsoil-boundary-draft-fill", type: "fill", source: BOUNDARY_DRAFT_SOURCE, filter: ["==", ["geometry-type"], "Polygon"], paint: { "fill-color": "#f0b75d", "fill-opacity": .2 } });
      map.addLayer({ id: "techsoil-boundary-draft-line", type: "line", source: BOUNDARY_DRAFT_SOURCE, filter: ["==", ["geometry-type"], "LineString"], layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#e49a36", "line-width": 4, "line-dasharray": [1.3, 1.3] } });
      map.addLayer({ id: "techsoil-boundary-draft-points", type: "circle", source: BOUNDARY_DRAFT_SOURCE, filter: ["==", ["geometry-type"], "Point"], paint: { "circle-radius": 6, "circle-color": "#f0b75d", "circle-stroke-color": "#fff", "circle-stroke-width": 2.5 } });
      map.addSource(LOCATION_SOURCE, { type: "geojson", data: locationGeoJson(null) });
      map.addLayer({ id: "techsoil-location-halo", type: "circle", source: LOCATION_SOURCE, paint: { "circle-radius": 15, "circle-color": "rgba(112,165,74,.2)" } });
      map.addLayer({ id: "techsoil-location-point", type: "circle", source: LOCATION_SOURCE, paint: { "circle-radius": 6, "circle-color": "#315d32", "circle-stroke-color": "#dfff9e", "circle-stroke-width": 3 } });
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
      if (interactionModeRef.current) {
        onMapClickRef.current({ latitude: event.lngLat.lat, longitude: event.lngLat.lng });
        return;
      }
      if (!map.getLayer(ROWS_HITBOX_LAYER)) return;
      const feature = map.queryRenderedFeatures(event.point, { layers: [ROWS_HITBOX_LAYER] })[0];
      const rowId = feature?.properties?.rowId;
      if (typeof rowId === "string") {
        onSelectRowRef.current(rowId);
        return;
      }
      const plotFeature = map.queryRenderedFeatures(event.point, { layers: [PLOTS_HITBOX_LAYER] })[0];
      const plotId = plotFeature?.properties?.plotId;
      if (typeof plotId === "string") onSelectPlotRef.current(plotId);
    });

    map.on("mousemove", (event: MapLayerMouseEvent) => {
      if (interactionModeRef.current) return;
      if (!map.getLayer(ROWS_HITBOX_LAYER)) return;
      const feature = map.queryRenderedFeatures(event.point, { layers: [ROWS_HITBOX_LAYER, PLOTS_HITBOX_LAYER] })[0];
      map.getCanvas().style.cursor = feature ? "pointer" : "grab";
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    basemapRef.current = basemap;
    const map = mapRef.current;
    if (map?.getLayer(SATELLITE_LAYER)) map.setLayoutProperty(SATELLITE_LAYER, "visibility", basemap === "satellite" ? "visible" : "none");
  }, [basemap]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const updateSources = () => {
      (map.getSource(ROWS_SOURCE) as GeoJSONSource | undefined)?.setData(rowsGeoJson(rows, selectedRowId));
      (map.getSource(ENDPOINTS_SOURCE) as GeoJSONSource | undefined)?.setData(endpointsGeoJson(rows));
      (map.getSource(DRAFT_SOURCE) as GeoJSONSource | undefined)?.setData(draftGeoJson(draftStart, draftEnd));
      (map.getSource(BOUNDARY_SOURCE) as GeoJSONSource | undefined)?.setData(boundaryGeoJson(boundary));
      (map.getSource(BOUNDARY_DRAFT_SOURCE) as GeoJSONSource | undefined)?.setData(boundaryDraftGeoJson(boundaryDraft));
      (map.getSource(PLOTS_SOURCE) as GeoJSONSource | undefined)?.setData(plotsGeoJson(plots, selectedPlotId));
      (map.getSource(PLOT_DRAFT_SOURCE) as GeoJSONSource | undefined)?.setData(boundaryDraftGeoJson(plotDraft));
      (map.getSource(LOCATION_SOURCE) as GeoJSONSource | undefined)?.setData(locationGeoJson(center));
    };
    if (map.getSource(ROWS_SOURCE)) updateSources();
    else map.once("load", updateSources);
    return () => { map.off("load", updateSources); };
  }, [boundary, boundaryDraft, center, draftEnd, draftStart, plotDraft, plots, rows, selectedPlotId, selectedRowId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const markers: Marker[] = [];
    const popups: Popup[] = [];
    let fitFrame: number | null = null;
    const fitOpenPopup = () => {
      if (fitFrame !== null) cancelAnimationFrame(fitFrame);
      fitFrame = requestAnimationFrame(() => {
        fitFrame = null;
        const popup = popups.find((item) => item.isOpen());
        const element = popup?.getElement();
        if (!element) return;
        const viewport = map.getContainer().getBoundingClientRect();
        const content = element.querySelector<HTMLElement>(`.${styles.sensorPopup}`);
        if (!content || viewport.width < 40 || viewport.height < 100) return;
        content.style.maxWidth = `${viewport.width - 34}px`;
        content.style.maxHeight = `${viewport.height - 94}px`;
        const offset = popupPanOffset(element.getBoundingClientRect(), {
          left: viewport.left + 16, right: viewport.right - 16,
          top: viewport.top + 56, bottom: viewport.bottom - 24,
        });
        if (Math.abs(offset[0]) > 1 || Math.abs(offset[1]) > 1) {
          map.panBy(offset, { duration: 250 });
        }
      });
    };
    map.on("resize", fitOpenPopup);
    const renderSensors = () => {
      for (const sensor of sensors) {
        const coordinates = sensorCoordinates(sensor);
        if (!coordinates) continue;
        const state = sensorMapStatus(sensor, alerts);
        const button = document.createElement("button");
        button.type = "button";
        button.className = `${styles.sensorMarker} ${styles[state.key]}`;
        button.textContent = "S";
        button.setAttribute("aria-label", `${sensor.device.name}: ${state.label}. Abrir detalhes`);
        button.title = `${sensor.device.name} · ${state.label}`;
        button.style.pointerEvents = interactionMode ? "none" : "auto";
        button.disabled = Boolean(interactionMode);
        const content = createSensorPopup(sensor, alerts, coordinates);
        const popup = new Popup({ anchor: "bottom", offset: 20, maxWidth: "min(300px, calc(100vw - 48px))", className: styles.popupShell }).setDOMContent(content);
        const marker = new Marker({ element: button }).setLngLat(coordinates).addTo(map);
        button.addEventListener("click", (event) => {
          event.stopPropagation();
          if (popup.isOpen()) popup.remove();
          else {
            popups.forEach((other) => other.remove());
            map.stop();
            popup.setLngLat(coordinates).addTo(map);
            fitOpenPopup();
          }
        });
        markers.push(marker);
        popups.push(popup);
      }
    };
    if (map.getSource(ROWS_SOURCE)) renderSensors();
    else map.once("load", renderSensors);
    return () => {
      map.off("load", renderSensors);
      map.off("resize", fitOpenPopup);
      if (fitFrame !== null) cancelAnimationFrame(fitFrame);
      popups.forEach((popup) => popup.remove());
      markers.forEach((marker) => marker.remove());
    };
  }, [sensors, alerts, interactionMode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !sensorFocus || interactionMode) return;
    map.flyTo({ center: sensorFocus.coordinates, zoom: 18, duration: 650 });
  }, [sensorFocus, interactionMode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !center || boundaryDraft.length) return;
    map.flyTo({ center: [center.longitude, center.latitude], zoom, duration: 900 });
  }, [boundaryDraft.length, center, zoom]);

  useEffect(() => {
    const map = mapRef.current;
    const ring = boundary?.coordinates[0];
    if (!map || !ring?.length) return;
    const bounds = new LngLatBounds();
    ring.forEach((coordinate) => bounds.extend([coordinate[0], coordinate[1]]));
    map.fitBounds(bounds, { padding: 75, maxZoom: 18, duration: 800 });
  }, [boundary]);

  useEffect(() => {
    const map = mapRef.current;
    const mappedRows = rows.filter(hasCoordinates);
    const rowsKey = mappedRows.map((row) => row.id).join(":");
    if (!map || boundary || !mappedRows.length || fittedRowsRef.current === rowsKey) return;
    fittedRowsRef.current = rowsKey;

    const bounds = new LngLatBounds();
    mappedRows.forEach((row) => {
      bounds.extend([row.startLongitude, row.startLatitude]);
      bounds.extend([row.endLongitude, row.endLatitude]);
    });
    map.fitBounds(bounds, { padding: 90, maxZoom: 17, duration: 800 });
  }, [boundary, rows]);

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

  useEffect(() => {
    const map = mapRef.current;
    const selected = plots.find((plot) => plot.id === selectedPlotId);
    const ring = selected?.boundaryGeoJson.coordinates[0];
    if (!map || !ring?.length) return;
    const bounds = new LngLatBounds();
    ring.forEach(([longitude, latitude]) => bounds.extend([longitude, latitude]));
    map.fitBounds(bounds, { padding: 100, maxZoom: 18, duration: 650 });
  }, [plots, selectedPlotId]);

  return <div className={styles.map} ref={containerRef} aria-label="Mapa interativo dos sensores, talhões e linhas da plantação" />;
}
