"use client";

import { type FormEvent, useState } from "react";
import type { UserProfile } from "@/features/auth";
import { EditIcon } from "./EditIcon";
import { profileError } from "../../utils/profile-error";
import styles from "./ProfileScreen.module.css";

export function ProfileForm({
  profile,
  onSave,
}: {
  profile: UserProfile;
  onSave: (name: string) => Promise<UserProfile>;
}) {
  const [name, setName] = useState(profile.name);
  const [savedName, setSavedName] = useState(profile.name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [editing, setEditing] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    if (name.trim().length < 2) {
      setError("Informe um nome com pelo menos 2 caracteres.");
      return;
    }
    setSaving(true);
    try {
      const updated = await onSave(name.trim());
      setName(updated.name);
      setSavedName(updated.name);
      setSuccess(true);
      setEditing(false);
    } catch (error) {
      setError(profileError(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={styles.card}>
      <div className={styles.cardHeading}>
        <div>
          <h2>Informações pessoais</h2>
          <p>Dados do seu acesso à TechSoil Systems.</p>
        </div>
        {!editing && (
          <button
            className={styles.editButton}
            type="button"
            onClick={() => {
              setEditing(true);
              setSuccess(false);
              setError(null);
            }}
            aria-expanded={editing}
            aria-controls="profile-edit-form"
          >
            Editar <EditIcon />
          </button>
        )}
      </div>
      <dl className={styles.details}>
        <div>
          <dt>Nome completo</dt>
          <dd>{savedName}</dd>
        </div>
        <div>
          <dt>E-mail de acesso</dt>
          <dd>{profile.email}</dd>
        </div>
        <div>
          <dt>Tipo de conta</dt>
          <dd>
            {profile.systemRole === "SUPERADMIN" ? "Superadmin" : "Usuário"}
          </dd>
        </div>
        <div>
          <dt>Conta criada em</dt>
          <dd>{new Date(profile.createdAt).toLocaleDateString("pt-BR")}</dd>
        </div>
      </dl>
      {editing && (
        <form id="profile-edit-form" onSubmit={submit} className={styles.form}>
          <label htmlFor="profile-name">Nome completo</label>
          <input
            id="profile-name"
            name="name"
            autoComplete="name"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setSuccess(false);
            }}
            minLength={2}
            maxLength={120}
            required
            disabled={saving}
          />
          <small>
            Seu nome será atualizado em todo o painel. O e-mail e o tipo de
            conta não podem ser alterados por esta tela.
          </small>
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
          <div className={styles.formActions}>
            <button
              className={styles.secondaryButton}
              type="button"
              disabled={saving}
              onClick={() => {
                setEditing(false);
                setName(savedName);
                setError(null);
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || name.trim() === savedName}
            >
              {saving ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </form>
      )}
      {success && (
        <p className={styles.success} role="status">
          Nome atualizado com sucesso.
        </p>
      )}
    </section>
  );
}
