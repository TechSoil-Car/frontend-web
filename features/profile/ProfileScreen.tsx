"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
        <h1>Meu perfil</h1>
        <span>Suas informações e a segurança da sua conta TechSoil.</span>
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
          <section
            className={`${styles.card} ${styles.summary}`}
            aria-label="Resumo da conta"
          >
            <span className={styles.avatar} aria-hidden="true">
              {(user?.name ?? profile.name)
                .split(/\s+/)
                .slice(0, 2)
                .map((part) => part[0])
                .join("")
                .toUpperCase()}
            </span>
            <div className={styles.identity}>
              <h2>{user?.name ?? profile.name}</h2>
              <p>
                {profile.systemRole === "SUPERADMIN"
                  ? "Superadmin da plataforma"
                  : "Usuário TechSoil"}
              </p>
              <span>{profile.email}</span>
            </div>
            <span className={styles.accountStatus}>
              <i aria-hidden="true" /> Conta ativa
            </span>
          </section>
          <ProfileForm
            key={profile.id}
            profile={profile}
            onSave={updateProfile}
          />
          <PasswordForm
            onSuccess={completePasswordChange}
            email={user?.email ?? profile.email}
          />
          <SessionCard />
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
      setError(errorMessage(error));
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

function PasswordForm({
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
      setError(errorMessage(error));
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

function EditIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="15"
      height="15"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m15 5 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15l-1 5Z" />
    </svg>
  );
}

function SessionCard() {
  const { logout } = useAuth();
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogout() {
    setLeaving(true);
    setError(null);
    try {
      await logout();
      router.replace("/login");
    } catch {
      setError(
        "Não foi possível encerrar a sessão. Verifique sua conexão e tente novamente.",
      );
      setLeaving(false);
    }
  }

  return (
    <section
      className={`${styles.card} ${styles.session}`}
      aria-label="Sessão atual"
    >
      <div>
        <h2>Sessão atual</h2>
        <p>Encerre seu acesso à TechSoil neste navegador.</p>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
      </div>
      <button
        className={styles.logoutButton}
        type="button"
        onClick={handleLogout}
        disabled={leaving}
      >
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5M14 8l4 4-4 4M8 12h13" />
        </svg>
        {leaving ? "Saindo..." : "Sair da conta"}
      </button>
    </section>
  );
}
