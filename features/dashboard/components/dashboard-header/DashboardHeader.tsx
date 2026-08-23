import { DashboardIcon } from "../dashboard-icons/DashboardIcon";
import { useAuth } from "@/features/auth";
import { usePlantations } from "@/features/plantations/context/PlantationContext";
import styles from "./DashboardHeader.module.css";

type DashboardHeaderProps = { onMenuOpen: () => void };

export function DashboardHeader({ onMenuOpen }: DashboardHeaderProps) {
  const { user } = useAuth();
  const { selectedPlantation } = usePlantations();
  const initials = user?.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() ?? "TS";

  return (
    <header className={styles.header}>
      <button className={styles.menuButton} type="button" aria-label="Abrir menu" onClick={onMenuOpen}><DashboardIcon name="menu" /></button>
      <div className={styles.search}><DashboardIcon name="search" size={18} /><input aria-label="Buscar no painel" placeholder="Buscar no painel..." /></div>
      <div className={styles.weather}><DashboardIcon name="location" size={18} /><span><strong>{selectedPlantation?.location ?? "Local não informado"}</strong><small>Localização da propriedade</small></span></div>
      <button className={styles.notification} type="button" aria-label="Notificações"><DashboardIcon name="bell" size={19} /><i /></button>
      <span className={styles.avatar} title={user?.name}>{initials}</span>
    </header>
  );
}
