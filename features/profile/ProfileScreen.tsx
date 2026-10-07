"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/features/auth";
import {
  changePassword,
  getProfile,
  type UserProfile,
} from "@/features/auth/services/auth-api";
import { ApiError } from "@/shared/api/api-client";
import styles from "./ProfileScreen.module.css";

function errorMessage(error: unknown) {
  if (error instanceof ApiError && error.status === 429)
    return "Muitas tentativas. Aguarde um minuto e tente novamente.";
  return error instanceof ApiError
    ? error.message
    : "Não foi possível concluir. Verifique sua conexão e tente novamente.";
}

export function ProfileScreen() {
  const { user, updateProfile, completePasswordChange } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    getProfile()
      .then((value) => {
        if (active) {
          setProfile(value);
          setLoadError(null);
        }
      })
      .catch((error: unknown) => {
        if (active) setLoadError(errorMessage(error));
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  return (
    <main className={styles.page}>
      <header className={styles.heading}>
        <p>MINHA CONTA</p>
        <h1>Perfil e segurança</h1>
        <span>Cuide dos seus dados e mantenha seu acesso protegido.</span>
      </header>
      {!profile ? (
        loadError ? (
          <section className={styles.card}>
            <p role="alert">{loadError}</p>
            <button
              type="button"
              onClick={() => setAttempt((value) => value + 1)}
            >
              Tentar novamente
            </button>
          </section>
        ) : (
          <p role="status">Carregando seu perfil...</p>
        )
      ) : (
        <div className={styles.grid}>
          <ProfileForm
            key={profile.id}
            profile={profile}
            onSave={updateProfile}
          />
          <PasswordForm
            onSuccess={completePasswordChange}
            email={user?.email ?? profile.email}
          />
        </div>
      )}
    </main>
  );
}

function ProfileForm({
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
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={styles.card}>
      <div className={styles.cardHeading}>
        <span className={styles.badge}>SEUS DADOS</span>
        <h2>Informações pessoais</h2>
        <p>Seu nome será atualizado em todo o painel.</p>
      </div>
      <form onSubmit={submit} className={styles.form}>
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
        <label htmlFor="profile-email">E-mail de acesso</label>
        <input
          id="profile-email"
          type="email"
          value={profile.email}
          readOnly
          aria-describedby="email-help"
        />
        <small id="email-help">
          O e-mail de acesso não pode ser alterado por esta tela.
        </small>
        <dl className={styles.details}>
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
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        {success && (
          <p className={styles.success} role="status">
            Nome atualizado com sucesso.
          </p>
        )}
        <button type="submit" disabled={saving || name.trim() === savedName}>
          {saving ? "Salvando..." : "Salvar alterações"}
        </button>
      </form>
    </section>
  );
}

function PasswordForm({
  onSuccess,
  email,
}: {
  onSuccess: () => void;
  email: string;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setError(errorMessage(error));
      setSaving(false);
    }
  }

  return (
    <section className={styles.card}>
      <div className={styles.cardHeading}>
        <span className={styles.badge}>SEGURANÇA</span>
        <h2>Alterar senha</h2>
        <p>Confirme sua senha atual para definir uma nova.</p>
      </div>
      <form onSubmit={submit} className={styles.form}>
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
        <button type="submit" disabled={saving}>
          {saving ? "Alterando senha..." : "Alterar senha e sair"}
        </button>
      </form>
    </section>
  );
}
