import { DashboardIcon } from "@/features/dashboard/components/dashboard-icons/DashboardIcon";
import { roleLabel } from "@/features/organizations/types/organization.types";
import type { Plantation } from "../../types/plantation.types";
import { formatDate } from "../../utils/plantation-format";
import { PlantationPicture } from "./PlantationPicture";
import styles from "./PlantationsScreen.module.css";

/** Propriedade na lista; selecionar define a plantação ativa do painel. */
export function PlantationCard({
  plantation,
  selected,
  onSelect,
}: {
  plantation: Plantation;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      className={`${styles.plantationCard} ${selected ? styles.cardSelected : ""}`}
      type="button"
      onClick={onSelect}
    >
      <span className={styles.cardImage}>
        <PlantationPicture plantation={plantation} size={190} />
        <i
          className={
            plantation.role === "OWNER"
              ? styles.owner
              : styles.member
          }
        >
          <b />
          {roleLabel(plantation.role)}
        </i>
      </span>
      <span className={styles.cardContent}>
        <span className={styles.cardTitle}>
          <span>
            <strong>{plantation.name}</strong>
            <small>
              {plantation.location || "Localização não informada"}
            </small>
          </span>
          <DashboardIcon name="chevron" size={17} />
        </span>
        <span className={styles.cardMeta}>
          <span>
            <small>CADASTRADA EM</small>
            <strong>{formatDate(plantation.createdAt)}</strong>
          </span>
          <span>
            <small>SEU ACESSO</small>
            <strong>
              {plantation.role === "OWNER"
                ? "Gestão completa"
                : "Monitoramento"}
            </strong>
          </span>
        </span>
        <span className={styles.selectionState}>
          {selected ? (
            <>
              <i /> Plantação ativa no painel
            </>
          ) : (
            "Selecionar esta propriedade"
          )}
        </span>
      </span>
    </button>
  );
}
