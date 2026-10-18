import { DashboardIcon } from "@/features/dashboard/components/dashboard-icons/DashboardIcon";
import { SatelliteImage } from "@/features/map/components/satellite-image/SatelliteImage";
import type { Plantation } from "../../types/plantation.types";
import styles from "./PlantationsScreen.module.css";

/** Real satellite picture of the plantation, or a placeholder until it is located. */
export function PlantationPicture({ plantation, size }: { plantation: Plantation; size: number }) {
  if (plantation.centerLatitude == null || plantation.centerLongitude == null)
    return (
      <span className={styles.noLocation}>
        <DashboardIcon name="location" size={20} />
        Localização pendente
      </span>
    );
  return (
    <SatelliteImage
      latitude={plantation.centerLatitude}
      longitude={plantation.centerLongitude}
      zoom={plantation.mapZoom}
      boundary={plantation.boundaryGeoJson}
      size={size}
    />
  );
}
