import { DashboardIcon } from "../dashboard-icons/DashboardIcon";
import styles from "./DashboardHeader.module.css";

type DashboardHeaderProps = { onMenuOpen: () => void };

export function DashboardHeader({ onMenuOpen }: DashboardHeaderProps) {
  return (
    <header className={styles.header}>
      <button className={styles.menuButton} type="button" aria-label="Abrir menu" onClick={onMenuOpen}><DashboardIcon name="menu" /></button>
      <div className={styles.search}><DashboardIcon name="search" size={18} /><input aria-label="Buscar no painel" placeholder="Buscar no painel..." /></div>
      <div className={styles.weather}><DashboardIcon name="cloud" size={18} /><span><strong>22°C</strong><small>Campinas, SP</small></span></div>
      <button className={styles.notification} type="button" aria-label="Notificações"><DashboardIcon name="bell" size={19} /><i /></button>
      <span className={styles.avatar}>AF</span>
    </header>
  );
}
