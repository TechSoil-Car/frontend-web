"use client";

import { type FormEvent, useState } from "react";
import { errorMessage } from "@/shared/api/error-message";
import { Modal } from "@/shared/components/modal/Modal";
import styles from "@/shared/components/modal/Modal.module.css";
import { runAccountAction } from "../../services/admin-api";
import type { AccountAction, AdminUser } from "../../types/admin.types";
const labels: Record<AccountAction, string> = {
  block: "Bloquear conta",
  unblock: "Desbloquear conta",
  "revoke-sessions": "Revogar sessões",
};
const descriptions: Record<AccountAction, string> = {
  block:
    "Encerra todas as sessões e invalida links de recuperação de senha. A conta não poderá entrar nem aceitar convites enquanto estiver bloqueada. Plantações, equipe e dados serão preservados.",
  unblock:
    "Permite novo acesso se a conta já estiver ativada. Sessões e links de recuperação antigos não serão restaurados. Contas pendentes ainda precisam aceitar o convite de ativação.",
  "revoke-sessions":
    "Encerra todas as sessões em todos os dispositivos e invalida links de recuperação de senha. Não altera a senha nem o bloqueio: contas ativas e desbloqueadas poderão entrar novamente.",
};

export function AccountActionDialog({
  account,
  action,
  onClose,
  onSuccess,
}: {
  account: AdminUser;
  action: AccountAction;
  onClose: () => void;
  onSuccess: (message: string) => void;
}) {
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirmed =
    confirmation.trim().toLowerCase() === account.email.toLowerCase();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !confirmed) return;
    setBusy(true);
    setError(null);
    try {
      const result = await runAccountAction(account.id, action);
      onSuccess(result.message);
    } catch (requestError) {
      setError(
        errorMessage(
          requestError,
          "Não foi possível concluir a ação. Tente novamente.",
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title={labels[action]}
      kicker="ADMINISTRAÇÃO DE USUÁRIOS"
      busy={busy}
      onClose={onClose}
    >
      <p className={styles.intro}>
        <strong>{account.name}</strong> · {account.email}
      </p>
      <p className={styles.note}>{descriptions[action]}</p>
      <form className={styles.form} onSubmit={submit}>
        <label>
          Para confirmar, digite o e-mail da conta
          <input
            type="email"
            required
            autoComplete="off"
            spellCheck={false}
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            disabled={busy}
          />
        </label>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <footer className={styles.actions}>
          <button type="button" onClick={onClose} disabled={busy}>
            Cancelar
          </button>
          <button
            type="submit"
            className={action !== "unblock" ? styles.danger : undefined}
            disabled={busy || !confirmed}
          >
            {busy ? "Processando..." : labels[action]}
          </button>
        </footer>
      </form>
    </Modal>
  );
}
