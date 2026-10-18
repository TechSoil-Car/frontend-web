"use client";

import { type FormEvent, useState } from "react";
import { changePassword } from "@/features/auth/services/auth-api";
import { EditIcon } from "./EditIcon";
import { profileError } from "../../utils/profile-error";
import styles from "./ProfileScreen.module.css";

export function PasswordForm({
  onSuccess,
  email,
}: {
  onSuccess: () => void;
  email: string;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const currentPassword = String(form.get("currentPassword") ?? "");
    const newPassword = String(form.get("newPassword") ?? "");
    const confirmation = String(form.get("confirmation") ?? "");
    setError(null);
    if (newPassword !== confirmation) {
      setError("A confirmação não corresponde à nova senha.");
      return;
    }
    if (newPassword === currentPassword) {
      setError("A nova senha deve ser diferente da senha atual.");
      return;
    }
    if (new TextEncoder().encode(newPassword).length > 72) {
      setError(
        "A nova senha deve ter no máximo 72 bytes. Caracteres acentuados podem ocupar mais de um byte.",
      );
      return;
    }
    setSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      formElement.reset();
      onSuccess();
    } catch (error) {
      setError(profileError(error));
      setSaving(false);
    }
  }

  return (
    <section className={styles.card}>
      <div className={styles.cardHeading}>
        <div>
          <h2>Segurança da conta</h2>
          <p>Proteja seu acesso com uma senha exclusiva.</p>
        </div>
        {!editing && (
          <button
            className={styles.editButton}
            type="button"
            onClick={() => {
              setEditing(true);
              setError(null);
            }}
            aria-expanded={editing}
            aria-controls="password-edit-form"
          >
            Alterar senha <EditIcon />
          </button>
        )}
      </div>
      {!editing && (
        <div className={styles.securityOverview}>
          <span className={styles.securityIcon} aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              width="22"
              height="22"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <rect x="5" y="10" width="14" height="11" rx="3" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
            </svg>
          </span>
          <div>
            <strong>Senha de acesso</strong>
            <p>Para alterá-la, você precisará confirmar sua senha atual.</p>
          </div>
        </div>
      )}
      {editing && (
        <form id="password-edit-form" onSubmit={submit} className={styles.form}>
          <input
            type="text"
            name="username"
            autoComplete="username"
            value={email}
            readOnly
            hidden
          />
          <label htmlFor="current-password">Senha atual</label>
          <input
            id="current-password"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            maxLength={128}
            required
            disabled={saving}
          />
          <label htmlFor="new-password">Nova senha</label>
          <input
            id="new-password"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={72}
            aria-describedby="password-help"
            required
            disabled={saving}
          />
          <small id="password-help">
            Use pelo menos 8 caracteres e no máximo 72 bytes. Prefira uma senha
            longa e exclusiva.
          </small>
          <label htmlFor="confirm-password">Confirmar nova senha</label>
          <input
            id="confirm-password"
            name="confirmation"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={72}
            required
            disabled={saving}
          />
          <p className={styles.notice}>
            Ao alterar a senha, todas as sessões e os links de recuperação
            anteriores serão invalidados. Você precisará entrar novamente.
          </p>
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              disabled={saving}
              onClick={() => {
                setEditing(false);
                setError(null);
              }}
            >
              Cancelar
            </button>
            <button type="submit" disabled={saving}>
              {saving ? "Alterando senha..." : "Alterar senha e sair"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
