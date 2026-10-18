"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { errorMessage } from "@/shared/api/error-message";
import { useAuth } from "../../context/AuthContext";
import { useInvitePreview } from "../../hooks/use-invite-preview";
import { acceptInvite } from "../../services/auth-api";
import { usePlantations } from "@/features/plantations/context/PlantationContext";
import { ArrowIcon } from "@/app/landing-art";
import { PasswordChecklist, PasswordInput } from "../auth-form/PasswordInput";
import styles from "../auth-form/AuthForm.module.css";
import { AuthShell } from "../auth-shell/AuthShell";
import { InviteBadge, type InviteBadgeState } from "./InviteBadge";

export function AcceptInviteScreen({ token }: { token: string }) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { reloadPlantations } = usePlantations();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const { preview, error: previewError, retry } = useInvitePreview(token);
  // Só para a lista de requisitos; o envio continua lendo o FormData.
  const [typedPassword, setTypedPassword] = useState("");
  const [typedConfirmation, setTypedConfirmation] = useState("");

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
      await acceptInvite(token, password);
      setAccepted(true);
      window.history.replaceState(null, "", "/accept-invite");
    } catch (requestError) {
      setError(
        errorMessage(
          requestError,
          "Não foi possível aceitar o convite. Tente novamente.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  const badgeState: InviteBadgeState = accepted
    ? "accepted"
    : !token || previewError
      ? "invalid"
      : !preview
        ? "loading"
        : "ready";

  const heading = accepted
    ? { label: "Cadastro concluído", title: "Convite", mark: "aceito." }
    : badgeState === "invalid"
      ? { label: "Convite", title: "Convite", mark: "indisponível." }
      : badgeState === "loading"
        ? { label: "Convite", title: "Conferindo seu", mark: "convite..." }
        : preview?.requiresActivation
          ? { label: "Cadastro", title: "Crie sua", mark: "senha." }
          : { label: "Convite", title: "Entre na", mark: "equipe." };

  return (
    <AuthShell
      label={heading.label}
      title={
        <>
          {heading.title}{" "}
          <br />
          <mark>{heading.mark}</mark>
        </>
      }
      aside={
        <InviteBadge
          state={badgeState}
          name={preview?.name}
          email={preview?.email}
          plantation={preview?.plantationName}
        />
      }
      asideLabel="Crachá do convite"
      mobileAside="top"
    >
      {accepted ? (
        <div className={styles.form}>
          <p className={styles.success} role="status">
            {preview?.plantationName
              ? `Você já pode acessar ${preview.plantationName}. `
              : "Sua conta está pronta. "}
            {user?.email === preview?.email
              ? "A plantação está disponível na sua lista de propriedades."
              : `Entre com ${preview?.email} e ${preview?.requiresActivation ? "a senha que você escolheu." : "sua senha atual."}`}
          </p>
          {user && user.email !== preview?.email ? (
            <>
              <p className={styles.text}>
                Você está conectado com outro e-mail. Troque de conta para
                acessar este convite.
              </p>
              <button
                className={styles.submit}
                type="button"
                disabled={saving}
                onClick={() => void switchAccount()}
              >
                {saving ? "Saindo..." : "Entrar com a conta convidada"}
              </button>
            </>
          ) : (
            <Link
              className={styles.submit}
              href={user ? "/dashboard/plantacoes" : "/login"}
            >
              {user ? "Ver minhas plantações" : "Ir para o login"} <ArrowIcon />
            </Link>
          )}
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
        </div>
      ) : !token ? (
        <div className={styles.form}>
          <p className={styles.error} role="alert">
            O link de ativação está incompleto. Abra o convite recebido por
            e-mail ou solicite um novo ao administrador.
          </p>
          <Link className={styles.secondary} href="/login">
            Voltar ao login
          </Link>
        </div>
      ) : previewError ? (
        <div className={styles.form}>
          <p className={styles.error} role="alert">
            {previewError}
          </p>
          <p className={styles.text}>
            Se o convite expirou ou foi cancelado, solicite um novo ao
            proprietário ou administrador.
          </p>
          <button
            className={styles.secondary}
            type="button"
            onClick={retry}
          >
            Tentar novamente
          </button>
        </div>
      ) : !preview ? (
        <p className={styles.text} role="status">
          <span className={styles.spinner} aria-hidden="true" /> Conferindo seu convite...
        </p>
      ) : (
        <form className={styles.form} onSubmit={submit}>
          <p className={styles.text}>
            Convite para <strong>{preview.email}</strong>
            {preview.plantationName
              ? ` participar de ${preview.plantationName}.`
              : " acessar a plataforma."}{" "}
            {preview.requiresActivation
              ? "Crie uma senha pessoal para ativar sua conta."
              : "Você já possui uma conta. Confirme com sua senha atual para entrar nesta equipe."}
          </p>
          <PasswordInput
            id="password"
            name="password"
            label={preview.requiresActivation ? "Nova senha" : "Sua senha atual"}
            autoComplete={
              preview.requiresActivation ? "new-password" : "current-password"
            }
            disabled={saving}
            onChange={setTypedPassword}
          />
          {preview.requiresActivation ? (
            <>
              <PasswordInput
                id="confirmation"
                name="confirmation"
                label="Confirme a senha"
                autoComplete="new-password"
                disabled={saving}
                onChange={setTypedConfirmation}
              />
              <PasswordChecklist password={typedPassword} confirmation={typedConfirmation} />
            </>
          ) : (
            <Link className={styles.inlineLink} href="/forgot-password">
              Esqueci minha senha
            </Link>
          )}
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
          <button className={styles.submit} type="submit" disabled={saving}>
            {saving ? (
              <>
                <span className={styles.spinner} aria-hidden="true" /> Confirmando...
              </>
            ) : (
              <>
                {preview.requiresActivation ? "Ativar conta e aceitar" : "Aceitar convite"} <ArrowIcon />
              </>
            )}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
