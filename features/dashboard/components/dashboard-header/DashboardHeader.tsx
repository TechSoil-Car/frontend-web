import { DashboardIcon } from "../dashboard-icons/DashboardIcon";
import { useAuth } from "@/features/auth/context/AuthContext";
import { usePlantations } from "@/features/plantations/context/PlantationContext";
import styles from "./DashboardHeader.module.css";
import { NotificationBell } from "@/features/notifications";

type DashboardHeaderProps = { onMenuOpen: () => void };

export function DashboardHeader({ onMenuOpen }: DashboardHeaderProps) {
  const { user } = useAuth();
  const { selectedPlantation } = usePlantations();

  return (
    <header className={styles.header}>
      <button
        className={styles.menuButton}
        type="button"
        aria-label="Abrir menu"
        onClick={onMenuOpen}
      >
        <DashboardIcon name="menu" />
      </button>
      <div className={styles.search}>
        <DashboardIcon name="search" size={18} />
        <input
          aria-label="Buscar no painel"
          placeholder="Buscar no painel..."
        />
      </div>
      {user?.systemRole === "SUPERADMIN" ? (
        <div className={styles.weather}>
          <DashboardIcon name="settings" size={18} />
          <span>
            <strong>Administração da plataforma</strong>
            <small>Sem vínculo operacional</small>
          </span>
        </div>
      ) : (
        <>
          <div className={styles.weather}>
            <DashboardIcon name="location" size={18} />
            <span>
              <strong>
                {selectedPlantation?.location ?? "Local não informado"}
              </strong>
              <small>Localização da propriedade</small>
            </span>
          </div>
          <NotificationBell
            key={selectedPlantation?.id ?? "none"}
            plantationId={selectedPlantation?.id}
          />
        </>
      )}
    </header>
  );
}
