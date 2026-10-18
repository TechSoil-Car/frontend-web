import { DashboardIcon } from "@/features/dashboard/components/dashboard-icons/DashboardIcon";
import styles from "./PlantationsScreen.module.css";

/** Contagem de propriedades, gestão própria, compartilhadas e locais. */
export function PlantationsSummary({
  total,
  ownerCount,
  sharedCount,
  locationCount,
}: {
  total: number;
  ownerCount: number;
  sharedCount: number;
  locationCount: number;
}) {
  return (
    <section className={styles.summary} aria-label="Resumo das plantações">
      <article>
        <span className={styles.summaryIcon}>
          <DashboardIcon name="field" />
        </span>
        <div>
          <small>PROPRIEDADES</small>
          <strong>{total}</strong>
          <p>vinculadas à sua conta</p>
        </div>
      </article>
      <article>
        <span className={styles.summaryIcon}>
          <DashboardIcon name="settings" />
        </span>
        <div>
          <small>SOB MINHA GESTÃO</small>
          <strong>{ownerCount}</strong>
          <p>acesso como proprietário</p>
        </div>
      </article>
      <article>
        <span className={styles.summaryIcon}>
          <DashboardIcon name="team" />
        </span>
        <div>
          <small>COMPARTILHADAS</small>
          <strong>{sharedCount}</strong>
          <p>acesso como membro</p>
        </div>
      </article>
      <article>
        <span className={styles.summaryIcon}>
          <DashboardIcon name="location" />
        </span>
        <div>
          <small>LOCALIZAÇÕES</small>
          <strong>{locationCount}</strong>
          <p>locais informados</p>
        </div>
      </article>
    </section>
  );
}
