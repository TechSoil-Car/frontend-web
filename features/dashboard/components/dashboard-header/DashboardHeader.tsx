import { DashboardIcon } from "../dashboard-icons/DashboardIcon";
import Link from "next/link";
import { useAuth } from "@/features/auth";
import { usePlantations } from "@/features/plantations/context/PlantationContext";
import styles from "./DashboardHeader.module.css";

type DashboardHeaderProps = { onMenuOpen: () => void };

export function DashboardHeader({ onMenuOpen }: DashboardHeaderProps) {
  const { user } = useAuth();
  const { selectedPlantation } = usePlantations();
  const initials =
    user?.name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() ?? "TS";

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
          <button
            className={styles.notification}
            type="button"
            aria-label="Notificações"
          >
            <DashboardIcon name="bell" size={19} />
            <i />
          </button>
        </>
      )}
      <Link
        href="/dashboard/perfil"
        className={styles.avatar}
        title="Meu perfil"
        aria-label="Abrir meu perfil"
      >
        {initials}
      </Link>
    </header>
  );
}
