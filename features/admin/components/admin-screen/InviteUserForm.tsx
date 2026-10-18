"use client";

import type { FormEvent } from "react";
import type { AdminInviteInput, AdminPlantation } from "../../types/admin.types";
import styles from "./AdminScreen.module.css";

/** Convite de nova conta pelo superadmin; a plantação inicial é opcional. */
export function InviteUserForm({
  plantations,
  saving,
  loading,
  disabled,
  onInvite,
}: {
  plantations: AdminPlantation[];
  saving: boolean;
  loading: boolean;
  disabled: boolean;
  /** `reset` limpa o formulário; chamar só depois que o servidor aceitar o convite. */
  onInvite: (invite: AdminInviteInput, reset: () => void) => Promise<void>;
}) {
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const plantationId = String(form.get("plantationId") ?? "");
    await onInvite(
      {
        name: String(form.get("name")),
        email: String(form.get("email")),
        role: String(form.get("role")),
        ...(plantationId ? { plantationId } : {}),
      },
      () => formElement.reset(),
    );
  }

  return (
    <section className={styles.card} aria-labelledby="invite-title">
      <h2 id="invite-title">Convidar usuário</h2>
      <p>
        Novas contas são comuns. Proprietário é uma permissão da plantação,
        não de superadmin.
      </p>
      <form className={styles.form} onSubmit={submit}>
        <label>
          Nome
          <input
            name="name"
            required
            minLength={2}
            maxLength={120}
            disabled={saving}
            autoComplete="name"
          />
        </label>
        <label>
          E-mail
          <input
            name="email"
            type="email"
            required
            maxLength={254}
            disabled={saving}
            autoComplete="email"
          />
        </label>
        <label>
          Permissão na plantação
          <select name="role" defaultValue="VIEWER" disabled={saving}>
            <option value="VIEWER">Visualizador</option>
            <option value="OPERATOR">Operador</option>
            <option value="OWNER">Proprietário</option>
          </select>
        </label>
        <label>
          Plantação
          <select
            name="plantationId"
            disabled={saving || loading}
            defaultValue=""
          >
            <option value="">Sem vínculo inicial</option>
            {plantations.map((plantation) => (
              <option key={plantation.id} value={plantation.id}>
                {plantation.name}
              </option>
            ))}
          </select>
          <small>Lista da página atual da aba Plantações.</small>
        </label>
        <button type="submit" disabled={saving || loading || disabled}>
          {saving ? "Enviando..." : "Enviar convite"}
        </button>
      </form>
    </section>
  );
}
