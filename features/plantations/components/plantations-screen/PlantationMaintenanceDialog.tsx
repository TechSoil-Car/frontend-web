"use client";

import { type FormEvent, useState } from "react";
import { errorMessage } from "@/shared/api/error-message";
import { Modal } from "@/shared/components/modal/Modal";
import styles from "@/shared/components/modal/Modal.module.css";
import { usePlantations } from "../../context/PlantationContext";
import type { Plantation } from "../../types/plantation.types";

export function PlantationMaintenanceDialog({
  plantation,
  action,
  onClose,
  onSuccess,
}: {
  plantation: Plantation;
  action: "edit" | "remove";
  onClose: () => void;
  onSuccess: (message: string) => void;
}) {
  const { updatePlantation, removePlantation } = usePlantations();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const removing = action === "remove";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || plantation.role !== "OWNER") return;
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    if (removing && confirmation.trim() !== plantation.name) return;
    if (!removing && name.length < 2) {
      setError("Informe um nome com pelo menos 2 caracteres.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (removing) {
        await removePlantation(plantation.id);
        onSuccess(`Plantação “${plantation.name}” removida.`);
      } else {
        await updatePlantation(plantation.id, {
          name,
          location: String(form.get("location") ?? "").trim() || null,
        });
        onSuccess("Dados da plantação atualizados.");
      }
    } catch (error) {
      setError(
        errorMessage(
          error,
          "Não foi possível concluir. Verifique sua conexão e tente novamente.",
        ),
      );
      setBusy(false);
    }
  }

  return (
    <Modal
      title={removing ? "Remover plantação" : "Editar plantação"}
      kicker="GESTÃO DA PROPRIEDADE"
      busy={busy}
      onClose={onClose}
    >
      {removing ? (
        <>
          <p className={styles.warning}>
            Esta ação é permanente. Serão removidos o cadastro de{" "}
            <strong>{plantation.name}</strong>, o mapa e as divisões da área, as
            configurações de alertas, os vínculos de equipe e os convites desta
            plantação. As contas dos usuários não serão excluídas.
          </p>
          <p className={styles.note}>
            Plantações com dispositivos ou expedições vinculadas não podem ser
            excluídas. Remova os cadastros de sensores antes de tentar; dados
            operacionais protegidos não serão apagados automaticamente.
          </p>
        </>
      ) : (
        <p className={styles.intro}>
          Atualize nome e localização sem alterar a área desenhada no mapa, os
          sensores ou a equipe.
        </p>
      )}
      <form onSubmit={submit} className={styles.form}>
        {removing ? (
          <>
            <label htmlFor="confirm-plantation">
              Digite “{plantation.name}” para confirmar
            </label>
            <input
              id="confirm-plantation"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              autoComplete="off"
              disabled={busy}
              required
            />
          </>
        ) : (
          <>
            <label htmlFor="edit-plantation-name">Nome da plantação</label>
            <input
              id="edit-plantation-name"
              name="name"
              defaultValue={plantation.name}
              minLength={2}
              maxLength={120}
              required
              disabled={busy}
            />
            <label htmlFor="edit-plantation-location">
              Localização (opcional)
            </label>
            <input
              id="edit-plantation-location"
              name="location"
              defaultValue={plantation.location ?? ""}
              maxLength={240}
              disabled={busy}
            />
            <small>
              Deixe em branco para remover a descrição da localização. As
              coordenadas do mapa serão preservadas.
            </small>
          </>
        )}
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <div className={styles.actions}>
          <button type="button" onClick={onClose} disabled={busy}>
            Cancelar
          </button>
          <button
            type="submit"
            className={removing ? styles.danger : undefined}
            disabled={
              busy || (removing && confirmation.trim() !== plantation.name)
            }
          >
            {busy
              ? "Aguarde..."
              : removing
                ? "Remover plantação"
                : "Salvar alterações"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
