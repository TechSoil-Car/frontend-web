import type { FormEvent } from "react";
import { DashboardIcon } from "@/features/dashboard/components/dashboard-icons/DashboardIcon";
import styles from "./PlantationsScreen.module.css";

/** Cadastro de plantação na organização selecionada; só nome e local. */
export function CreatePlantationDialog({
  creating,
  error,
  onClose,
  onSubmit,
}: {
  creating: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className={styles.modalLayer} role="presentation">
      <button
        className={styles.modalBackdrop}
        type="button"
        aria-label="Fechar cadastro"
        onClick={() => !creating && onClose()}
      />
      <section
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-plantation-title"
      >
        <div className={styles.modalHead}>
          <span>
            <DashboardIcon name="field" />
          </span>
          <div>
            <p>NOVA PROPRIEDADE</p>
            <h2 id="new-plantation-title">Cadastrar plantação</h2>
          </div>
          <button
            type="button"
            aria-label="Fechar"
            onClick={() => onClose()}
            disabled={creating}
          >
            ×
          </button>
        </div>
        <p className={styles.modalIntro}>
          Comece pelo essencial. Depois você poderá adicionar dispositivos,
          fileiras e membros.
        </p>
        <form className={styles.createForm} onSubmit={onSubmit}>
          <label htmlFor="plantation-name">Nome da plantação</label>
          <input
            id="plantation-name"
            name="name"
            minLength={2}
            maxLength={120}
            placeholder="Ex.: Fazenda Santa Clara"
            autoFocus
            disabled={creating}
            required
          />
          <label htmlFor="plantation-location">
            Localização <span>opcional</span>
          </label>
          <input
            id="plantation-location"
            name="location"
            maxLength={240}
            placeholder="Ex.: Londrina, Paraná"
            disabled={creating}
          />
          {error && (
            <p className={styles.formError} role="alert">
              {error}
            </p>
          )}
          <div className={styles.formActions}>
            <button
              type="button"
              onClick={() => onClose()}
              disabled={creating}
            >
              Cancelar
            </button>
            <button type="submit" disabled={creating}>
              {creating ? "Criando..." : "Criar plantação"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
