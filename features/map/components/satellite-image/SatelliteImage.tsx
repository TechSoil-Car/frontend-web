import type { BoundaryPolygon } from "@/features/plantations/types/plantation.types";
import { SATELLITE_TILES_URL } from "../../utils/satellite";
import styles from "./SatelliteImage.module.css";

const TILE = 256;

type Props = {
  latitude: number;
  longitude: number;
  zoom: number | null;
  boundary: BoundaryPolygon | null;
  /** Smaller side of the rendered box in px, used to frame the perimeter. */
  size: number;
  className?: string;
};

/** Web Mercator pixel coordinates at a zoom level. */
function project(longitude: number, latitude: number, zoom: number) {
  const scale = TILE * 2 ** zoom;
  const sin = Math.sin((Math.max(-85, Math.min(85, latitude)) * Math.PI) / 180);
  return {
    x: ((longitude + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
  };
}

function frameZoom(boundary: BoundaryPolygon | null, fallback: number | null, size: number) {
  const ring = boundary?.coordinates[0];
  if (!ring?.length) return Math.min(18, Math.round(fallback ?? 16) - (size < 260 ? 1 : 0));
  // Largest zoom (up to 18) where the perimeter fills at most 70% of the image.
  for (let zoom = 18; zoom > 3; zoom--) {
    const points = ring.map(([lng, lat]) => project(lng, lat, zoom));
    const width = Math.max(...points.map((p) => p.x)) - Math.min(...points.map((p) => p.x));
    const height = Math.max(...points.map((p) => p.y)) - Math.min(...points.map((p) => p.y));
    if (Math.max(width, height) <= size * 0.7) return zoom;
  }
  return 4;
}

/**
 * Static satellite picture made of a 3×3 tile mosaic around the plantation,
 * with its perimeter. No WebGL, so it can repeat across many cards.
 */
export function SatelliteImage({ latitude, longitude, zoom, boundary, size, className }: Props) {
  const level = frameZoom(boundary, zoom, size);
  const ring = boundary?.coordinates[0];
  const center = ring?.length
    ? (() => {
        const points = ring.map(([lng, lat]) => project(lng, lat, level));
        const xs = points.map((p) => p.x);
        const ys = points.map((p) => p.y);
        return { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2 };
      })()
    : project(longitude, latitude, level);
  const tileX = Math.floor(center.x / TILE);
  const tileY = Math.floor(center.y / TILE);
  const tiles = [-1, 0, 1].flatMap((dy) => [-1, 0, 1].map((dx) => ({ x: tileX + dx, y: tileY + dy })));
  const perimeter = ring
    ?.map(([lng, lat]) => {
      const point = project(lng, lat, level);
      return `${(point.x - center.x).toFixed(1)},${(point.y - center.y).toFixed(1)}`;
    })
    .join(" ");

  return (
    <span className={`${styles.image} ${className ?? ""}`} aria-hidden="true">
      {tiles.map((tile) => (
        <span
          key={`${tile.x}:${tile.y}`}
          className={styles.tile}
          style={{
            left: `calc(50% + ${tile.x * TILE - center.x}px)`,
            top: `calc(50% + ${tile.y * TILE - center.y}px)`,
            backgroundImage: `url("${SATELLITE_TILES_URL.replace("{z}", String(level)).replace("{x}", String(tile.x)).replace("{y}", String(tile.y))}")`,
          }}
        />
      ))}
      {perimeter && (
        <svg className={styles.perimeter} width="1" height="1">
          <polygon points={perimeter} />
        </svg>
      )}
      <small className={styles.credit}>© Esri</small>
    </span>
  );
}
