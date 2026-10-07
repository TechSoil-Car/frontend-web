"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError, apiRequest } from "@/shared/api/api-client";
import { useAuth } from "../../context/AuthContext";
import { usePlantations } from "@/features/plantations/context/PlantationContext";
import styles from "./AcceptInviteScreen.module.css";

type Preview = {
  name: string;
  email: string;
  plantationName: string | null;
  requiresActivation: boolean;
};

export function AcceptInviteScreen({ token }: { token: string }) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { reloadPlantations } = usePlantations();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!token) return;
    let active = true;
    apiRequest<Preview>("/invites/preview", {
      method: "POST",
      authenticated: false,
      retryOnUnauthorized: false,
      body: JSON.stringify({ token }),
    })
      .then((data) => {
        if (active) {
          setPreview(data);
          setPreviewError(null);
        }
      })
      .catch((error: unknown) => {
        if (active)
          setPreviewError(
            error instanceof ApiError
              ? error.message
              : "Não foi possível consultar o convite.",
          );
      });
    return () => {
      active = false;
    };
  }, [token, attempt]);

  useEffect(() => {
    if (!accepted || !preview || user?.email !== preview.email) return;
    const timer = window.setTimeout(() => void reloadPlantations(), 0);
    return () => window.clearTimeout(timer);
  }, [accepted, preview, user?.email, reloadPlantations]);

  async function switchAccount() {
    setSaving(true);
    setError(null);
    try {
      await logout();
      router.replace("/login");
    } catch {
      setError("Não foi possível sair da conta atual. Tente novamente.");
      setSaving(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    if (!preview) return;
    if (new TextEncoder().encode(password).length > 72) {
      setError(
        "A senha deve ter até 72 bytes. Acentos e emojis podem ocupar mais de um byte.",
      );
      return;
    }
    if (preview.requiresActivation && password !== form.get("confirmation")) {
      setError("As senhas devem ser iguais.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await apiRequest("/invites/accept", {
        method: "POST",
        authenticated: false,
        retryOnUnauthorized: false,
        body: JSON.stringify({ token, password }),
      });
      setAccepted(true);
      window.history.replaceState(null, "", "/accept-invite");
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "Não foi possível aceitar o convite. Tente novamente.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <Link className={styles.brand} href="/">
          TECHSOIL SYSTEMS
        </Link>
        <small>SEU ACESSO À PLATAFORMA</small>
        <h1>
          {accepted
            ? "Convite aceito"
            : preview?.requiresActivation
              ? "Defina sua senha"
              : "Seu convite para a TechSoil"}
        </h1>
        {accepted ? (
          <>
            <p>
              {preview?.plantationName
                ? `Você já pode acessar ${preview.plantationName}. `
                : "Sua conta está pronta. "}
              {user?.email === preview?.email
                ? "A plantação está disponível na sua lista de propriedades."
                : `Entre com ${preview?.email} e ${preview?.requiresActivation ? "a senha que você escolheu." : "sua senha atual."}`}
            </p>
            {user && user.email !== preview?.email ? (
              <>
                <p>
                  Você está conectado com outro e-mail. Troque de conta para
                  acessar este convite.
                </p>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void switchAccount()}
                >
                  {saving ? "Saindo..." : "Entrar com a conta convidada"}
                </button>
              </>
            ) : (
              <Link
                className={styles.login}
                href={user ? "/dashboard/plantacoes" : "/login"}
              >
                {user ? "Ver minhas plantações →" : "Ir para o login →"}
              </Link>
            )}
            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}
          </>
        ) : !token ? (
          <>
            <p role="alert">
              O link de ativação está incompleto. Abra o convite recebido por
              e-mail ou solicite um novo ao administrador.
            </p>
            <Link href="/login">Voltar ao login</Link>
          </>
        ) : previewError ? (
          <>
            <p className={styles.error} role="alert">
              {previewError}
            </p>
            <button
              type="button"
              onClick={() => {
                setPreviewError(null);
                setAttempt((value) => value + 1);
              }}
            >
              Tentar novamente
            </button>
            <p>
              Se o convite expirou ou foi cancelado, solicite um novo ao
              proprietário ou administrador.
            </p>
          </>
        ) : !preview ? (
          <p role="status">Conferindo seu convite...</p>
        ) : (
          <>
            <p>
              Convite para <strong>{preview.email}</strong>
              {preview.plantationName
                ? ` participar de ${preview.plantationName}.`
                : " acessar a plataforma."}
            </p>
            <p>
              {preview.requiresActivation
                ? "Crie uma senha pessoal para ativar sua conta."
                : "Você já possui uma conta. Confirme com sua senha atual para entrar nesta equipe."}
            </p>
            <form onSubmit={submit}>
              <label>
                {preview.requiresActivation ? "Nova senha" : "Sua senha atual"}
                <input
                  name="password"
                  type="password"
                  minLength={8}
                  maxLength={72}
                  required
                  autoComplete={
                    preview.requiresActivation
                      ? "new-password"
                      : "current-password"
                  }
                  disabled={saving}
                />
              </label>
              {preview.requiresActivation && (
                <label>
                  Confirme a senha
                  <input
                    name="confirmation"
                    type="password"
                    minLength={8}
                    maxLength={72}
                    required
                    autoComplete="new-password"
                    disabled={saving}
                  />
                </label>
              )}
              {preview.requiresActivation ? (
                <small>Use entre 8 e 72 caracteres (até 72 bytes).</small>
              ) : (
                <Link href="/forgot-password">Esqueci minha senha</Link>
              )}
              <button type="submit" disabled={saving}>
                {saving
                  ? "Confirmando..."
                  : preview.requiresActivation
                    ? "Ativar conta e aceitar"
                    : "Aceitar convite"}
              </button>
              {error && (
                <p className={styles.error} role="alert">
                  {error}
                </p>
              )}
            </form>
          </>
        )}
      </section>
    </main>
  );
}
