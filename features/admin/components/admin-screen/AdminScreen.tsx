"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth";
import { errorMessage } from "@/shared/api/error-message";
import { ADMIN_ERROR, useAdminData } from "../../hooks/use-admin-data";
import { inviteUser, revokeAdminInvite } from "../../services/admin-api";
import type {
  AccountAction,
  AdminInviteInput,
  AdminTab,
  AdminUser,
} from "../../types/admin.types";
import { AccountActionDialog } from "../account-action-dialog/AccountActionDialog";
import { AdminRecords } from "./AdminRecords";
import { InviteUserForm } from "./InviteUserForm";
import styles from "./AdminScreen.module.css";

export function AdminScreen() {
  const { user, status: authStatus } = useAuth();
  const isAdmin = user?.systemRole === "SUPERADMIN";
  const { data, pages, setPages, loading, error, reload } = useAdminData(isAdmin);
  const [tab, setTab] = useState<AdminTab>("users");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [accountAction, setAccountAction] = useState<{
    account: AdminUser;
    action: AccountAction;
  } | null>(null);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const updateTime = () => setCurrentTime(Date.now());
    updateTime();
    const timer = window.setInterval(updateTime, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  async function invite(input: AdminInviteInput, reset: () => void) {
    setSaving(true);
    setFeedback(null);
    try {
      await inviteUser(input);
      reset();
      setFeedback(
        "Convite enviado por e-mail. A pessoa definirá a própria senha ao ativar a conta.",
      );
      await reload();
    } catch (requestError) {
      setFeedback(errorMessage(requestError, ADMIN_ERROR));
    } finally {
      setSaving(false);
    }
  }

  async function revoke(id: string) {
    if (
      !window.confirm(
        "Revogar este convite? O link de ativação deixará de funcionar.",
      )
    )
      return;
    setSaving(true);
    setFeedback(null);
    try {
      await revokeAdminInvite(id);
      setFeedback("Convite revogado.");
      await reload();
    } catch (requestError) {
      setFeedback(errorMessage(requestError, ADMIN_ERROR));
    } finally {
      setSaving(false);
    }
  }

  if (authStatus === "loading")
    return (
      <main className={styles.page}>
        <p role="status">Verificando acesso...</p>
      </main>
    );
  if (!isAdmin)
    return (
      <main className={styles.page}>
        <h1>Acesso restrito</h1>
        <p>Esta área é exclusiva do superadmin.</p>
        <Link href="/dashboard">Voltar ao painel</Link>
      </main>
    );

  return (
    <main className={styles.page}>
      <header className={styles.heading}>
        <div>
          <small>ADMINISTRAÇÃO DA PLATAFORMA</small>
          <h1>Painel do superadmin</h1>
          <p>Gerencie contas e convites sem compartilhar senhas.</p>
        </div>
        <button
          type="button"
          disabled={loading || saving}
          onClick={() => void reload()}
        >
          Atualizar
        </button>
      </header>
      {feedback && <p role="status">{feedback}</p>}
      <section className={styles.profile} aria-label="Seu perfil">
        <span>SA</span>
        <div>
          <strong>{user.name}</strong>
          <p>{user.email}</p>
        </div>
        <b>Superadmin</b>
      </section>
      {data && (
        <section className={styles.stats} aria-label="Resumo da plataforma">
          {[
            ["Usuários cadastrados", data.overview.users],
            ["Contas ativas", data.overview.activeUsers],
            ["Plantações", data.overview.plantations],
            ["Convites pendentes", data.overview.pendingInvites],
          ].map(([label, value]) => (
            <article key={label}>
              <small>{label}</small>
              <strong>{value}</strong>
            </article>
          ))}
        </section>
      )}
      <AdminRecords
        data={data}
        tab={tab}
        onTab={setTab}
        pages={pages}
        onPages={setPages}
        loading={loading}
        error={error}
        saving={saving}
        currentUserId={user.id}
        currentTime={currentTime}
        onAccountAction={(account, action) => setAccountAction({ account, action })}
        onRevokeInvite={(id) => void revoke(id)}
      />
      <InviteUserForm
        plantations={data?.plantations.data ?? []}
        saving={saving}
        loading={loading}
        disabled={Boolean(error)}
        onInvite={invite}
      />
      {accountAction && (
        <AccountActionDialog
          account={accountAction.account}
          action={accountAction.action}
          onClose={() => setAccountAction(null)}
          onSuccess={(message) => {
            setAccountAction(null);
            setFeedback(message);
            void reload();
          }}
        />
      )}
    </main>
  );
}
