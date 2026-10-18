import { DashboardIcon } from "@/features/dashboard/components/dashboard-icons/DashboardIcon";
import { roleLabel } from "@/features/organizations/types/organization.types";
import type { Plantation } from "../../types/plantation.types";
import { formatDate, initials } from "../../utils/plantation-format";
import { PlantationPicture } from "./PlantationPicture";
import styles from "./PlantationsScreen.module.css";

/** Resumo da plantação ativa, com edição/remoção para o proprietário. */
export function PlantationDetails({
  plantation,
  onOpen,
  onMaintenance,
}: {
  plantation: Plantation;
  onOpen: () => void;
  onMaintenance: (action: "edit" | "remove") => void;
}) {
  return (
    <aside
      className={styles.details}
      aria-label={`Resumo de ${plantation.name}`}
    >
      <div className={styles.detailHero}>
        <PlantationPicture plantation={plantation} size={190} />
        <div />
        <span className={styles.detailStatus}>
          <i /> Selecionada
        </span>
        <span className={styles.detailIdentity}>
          <b>{initials(plantation.name)}</b>
          <span>
            <strong>{plantation.name}</strong>
            <small>
              {plantation.location ||
                "Localização não informada"}
            </small>
          </span>
        </span>
      </div>
      <div className={styles.detailBody}>
        <p className={styles.detailKicker}>ÁREA DE TRABALHO ATIVA</p>
        <h2>Pronta para monitoramento</h2>
        <p className={styles.detailCopy}>
          Sensores, alertas e missões do painel serão associados a
          esta plantação.
        </p>
        <div className={styles.detailMetrics}>
          <article>
            <small>Nível de acesso</small>
            <strong>
              {roleLabel(plantation.role)}
            </strong>
            <span>
              {plantation.role === "OWNER"
                ? "Pode gerenciar recursos"
                : "Pode acompanhar a operação"}
            </span>
          </article>
          <article>
            <small>Data de cadastro</small>
            <strong>
              {formatDate(plantation.createdAt)}
            </strong>
            <span>Registro sincronizado</span>
          </article>
        </div>
        <button
          className={styles.openButton}
          type="button"
          onClick={onOpen}
        >
          Abrir painel <DashboardIcon name="arrow" size={17} />
        </button>
        {plantation.role === "OWNER" && (
          <>
            <button
              className={styles.secondaryButton}
              type="button"
              onClick={() => onMaintenance("edit")}
            >
              <DashboardIcon name="settings" size={16} /> Editar
              plantação
            </button>
            <button
              className={styles.removeButton}
              type="button"
              onClick={() => onMaintenance("remove")}
            >
              <DashboardIcon name="trash" size={16} /> Remover
              plantação
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
