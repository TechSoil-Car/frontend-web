"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth";
import { ApiError, apiRequest } from "@/shared/api/api-client";
import type {
  AdminInvite,
  AdminOverview,
  AdminPlantation,
  AdminUser,
  PageResult,
} from "./types";
import styles from "./AdminScreen.module.css";
import { AccountActionDialog, type AccountAction } from "./AccountActionDialog";

type Tab = "users" | "plantations" | "invites";
type Data = {
  overview: AdminOverview;
  users: PageResult<AdminUser>;
  plantations: PageResult<AdminPlantation>;
  invites: PageResult<AdminInvite>;
};
const tabs: { key: Tab; label: string }[] = [
  { key: "users", label: "Usuários" },
  { key: "plantations", label: "Plantações" },
  { key: "invites", label: "Convites" },
];
const errorMessage = (error: unknown) =>
  error instanceof ApiError
    ? error.message
    : "Não foi possível acessar o serviço. Tente novamente.";

export function AdminScreen() {
  const { user, status: authStatus } = useAuth();
  const [data, setData] = useState<Data | null>(null);
  const [tab, setTab] = useState<Tab>("users");
  const [pages, setPages] = useState({ users: 1, plantations: 1, invites: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [accountAction, setAccountAction] = useState<{
    account: AdminUser;
    action: AccountAction;
  } | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const version = useRef(0);
  const isAdmin = user?.systemRole === "SUPERADMIN";

  const reload = useCallback(async () => {
    if (!isAdmin) return;
    const request = ++version.current;
    setLoading(true);
    setError(null);
    try {
      const [overview, users, plantations, invites] = await Promise.all([
        apiRequest<AdminOverview>("/admin/overview"),
        apiRequest<PageResult<AdminUser>>(`/admin/users?page=${pages.users}`),
        apiRequest<PageResult<AdminPlantation>>(
          `/admin/plantations?page=${pages.plantations}`,
        ),
        apiRequest<PageResult<AdminInvite>>(
          `/admin/invites?page=${pages.invites}`,
        ),
      ]);
      if (request === version.current)
        setData({ overview, users, plantations, invites });
    } catch (requestError) {
      if (request === version.current) {
        setError(errorMessage(requestError));
        setData(null);
      }
    } finally {
      if (request === version.current) setLoading(false);
    }
  }, [isAdmin, pages]);

  useEffect(() => {
    const timer = window.setTimeout(() => void reload(), 0);
    return () => {
      window.clearTimeout(timer);
      version.current += 1;
    };
  }, [reload]);

  useEffect(() => {
    const updateTime = () => setCurrentTime(Date.now());
    updateTime();
    const timer = window.setInterval(updateTime, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setSaving(true);
    setFeedback(null);
    try {
      const plantationId = String(form.get("plantationId") ?? "");
      await apiRequest("/admin/invites", {
        method: "POST",
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          role: form.get("role"),
          ...(plantationId ? { plantationId } : {}),
        }),
      });
      formElement.reset();
      setFeedback(
        "Convite enviado por e-mail. A pessoa definirá a própria senha ao ativar a conta.",
      );
      await reload();
    } catch (requestError) {
      setFeedback(errorMessage(requestError));
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
      await apiRequest(`/admin/invites/${id}`, { method: "DELETE" });
      setFeedback("Convite revogado.");
      await reload();
    } catch (requestError) {
      setFeedback(errorMessage(requestError));
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
  const result = data?.[tab];

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
      <section className={styles.card}>
        <div
          className={styles.tabs}
          role="tablist"
          aria-label="Gestão da plataforma"
        >
          {tabs.map((item) => (
            <button
              type="button"
              role="tab"
              aria-selected={tab === item.key}
              key={item.key}
              onClick={() => setTab(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
        {loading && <p role="status">Carregando registros...</p>}
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        {!loading && data && (
          <>
            <div className={styles.tableScroll}>
              <table>
                <caption>
                  {tabs.find((item) => item.key === tab)?.label} da plataforma
                </caption>
                <thead>
                  <tr>
                    {(tab === "users"
                      ? ["Conta", "Perfil", "Estado", "Plantações", "Ações"]
                      : tab === "plantations"
                        ? [
                            "Propriedade",
                            "Localização",
                            "Membros",
                            "Dispositivos",
                          ]
                        : [
                            "Destinatário",
                            "Acesso",
                            "Plantação",
                            "Estado / ação",
                          ]
                    ).map((label) => (
                      <th key={label} scope="col">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tab === "users" &&
                    data.users.data.map((account) => (
                      <tr key={account.id}>
                        <td>
                          <strong>{account.name}</strong>
                          <small>{account.email}</small>
                        </td>
                        <td>
                          {account.systemRole === "SUPERADMIN"
                            ? "Superadmin"
                            : "Usuário"}
                        </td>
                        <td>
                          <span
                            className={
                              account.blockedAt
                                ? styles.blocked
                                : account.activatedAt
                                  ? styles.active
                                  : styles.pending
                            }
                          >
                            {account.blockedAt
                              ? "Bloqueado"
                              : account.activatedAt
                                ? "Ativo"
                                : "Pendente"}
                          </span>
                          {account.blockedAt && (
                            <small>
                              Desde{" "}
                              {new Date(account.blockedAt).toLocaleString(
                                "pt-BR",
                              )}
                            </small>
                          )}
                        </td>
                        <td>
                          {account.plantations.length
                            ? account.plantations
                                .map(
                                  (membership) =>
                                    `${membership.plantation.name} (${membership.role === "OWNER" ? "proprietário" : "membro"})`,
                                )
                                .join(", ")
                            : "Sem vínculo"}
                        </td>
                        <td>
                          {account.id === user.id ? (
                            <small>
                              Sua conta · gerencie a sessão em Meu perfil.
                            </small>
                          ) : (
                            <div className={styles.accountActions}>
                              {account.systemRole === "SUPERADMIN" ? (
                                <small>Bloqueio protegido</small>
                              ) : (
                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={() =>
                                    setAccountAction({
                                      account,
                                      action: account.blockedAt
                                        ? "unblock"
                                        : "block",
                                    })
                                  }
                                >
                                  {account.blockedAt
                                    ? "Desbloquear"
                                    : "Bloquear"}
                                </button>
                              )}
                              <button
                                type="button"
                                disabled={saving}
                                onClick={() =>
                                  setAccountAction({
                                    account,
                                    action: "revoke-sessions",
                                  })
                                }
                              >
                                Revogar sessões
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  {tab === "plantations" &&
                    data.plantations.data.map((plantation) => (
                      <tr key={plantation.id}>
                        <td>
                          <strong>{plantation.name}</strong>
                        </td>
                        <td>{plantation.location ?? "Não informada"}</td>
                        <td>{plantation._count.members}</td>
                        <td>{plantation._count.devices}</td>
                      </tr>
                    ))}
                  {tab === "invites" &&
                    data.invites.data.map((invitation) => {
                      const pending =
                        !invitation.acceptedAt &&
                        new Date(invitation.expiresAt).getTime() > currentTime;
                      return (
                        <tr key={invitation.id}>
                          <td>
                            <strong>{invitation.name}</strong>
                            <small>{invitation.email}</small>
                          </td>
                          <td>
                            {invitation.role === "OWNER"
                              ? "Proprietário"
                              : "Membro"}
                          </td>
                          <td>
                            {invitation.plantation?.name ??
                              "Sem vínculo inicial"}
                          </td>
                          <td>
                            {invitation.acceptedAt ? (
                              "Aceito"
                            ) : pending ? (
                              <>
                                <span>Pendente</span>
                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={() => void revoke(invitation.id)}
                                >
                                  Revogar
                                </button>
                              </>
                            ) : (
                              "Expirado / revogado"
                            )}
                            <small>
                              Validade:{" "}
                              {new Date(invitation.expiresAt).toLocaleString(
                                "pt-BR",
                              )}
                            </small>
                          </td>
                        </tr>
                      );
                    })}
                  {result?.data.length === 0 && (
                    <tr>
                      <td colSpan={tab === "users" ? 5 : 4}>
                        Nenhum registro encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {result && (
              <footer className={styles.pagination}>
                <button
                  type="button"
                  disabled={pages[tab] <= 1}
                  onClick={() =>
                    setPages((current) => ({
                      ...current,
                      [tab]: current[tab] - 1,
                    }))
                  }
                >
                  Anterior
                </button>
                <span>
                  Página {result.page} · {result.total} registros
                </span>
                <button
                  type="button"
                  disabled={result.page * result.pageSize >= result.total}
                  onClick={() =>
                    setPages((current) => ({
                      ...current,
                      [tab]: current[tab] + 1,
                    }))
                  }
                >
                  Próxima
                </button>
              </footer>
            )}
          </>
        )}
      </section>
      <section className={styles.card} aria-labelledby="invite-title">
        <h2 id="invite-title">Convidar usuário</h2>
        <p>
          Novas contas são comuns. Proprietário é uma permissão da plantação,
          não de superadmin.
        </p>
        <form className={styles.form} onSubmit={invite}>
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
            <select name="role" defaultValue="MEMBER" disabled={saving}>
              <option value="MEMBER">Membro</option>
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
              {data?.plantations.data.map((plantation) => (
                <option key={plantation.id} value={plantation.id}>
                  {plantation.name}
                </option>
              ))}
            </select>
            <small>Lista da página atual da aba Plantações.</small>
          </label>
          <button type="submit" disabled={saving || loading || Boolean(error)}>
            {saving ? "Enviando..." : "Enviar convite"}
          </button>
        </form>
      </section>
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
