"use client";

import { roleLabel } from "@/features/organizations/types";
import type {
  AccountAction,
  AdminData,
  AdminInvite,
  AdminPages,
  AdminPlantation,
  AdminTab,
  AdminUser,
} from "../../types/admin.types";
import styles from "./AdminScreen.module.css";

export const adminTabs: { key: AdminTab; label: string }[] = [
  { key: "users", label: "Usuários" },
  { key: "plantations", label: "Plantações" },
  { key: "invites", label: "Convites" },
];
const columns: Record<AdminTab, string[]> = {
  users: ["Conta", "Perfil", "Estado", "Plantações", "Ações"],
  plantations: ["Propriedade", "Localização", "Membros", "Dispositivos"],
  invites: ["Destinatário", "Acesso", "Plantação", "Estado / ação"],
};

/** Abas, tabela da aba atual e paginação do painel do superadmin. */
export function AdminRecords({
  data,
  tab,
  onTab,
  pages,
  onPages,
  loading,
  error,
  saving,
  currentUserId,
  currentTime,
  onAccountAction,
  onRevokeInvite,
}: {
  data: AdminData | null;
  tab: AdminTab;
  onTab: (tab: AdminTab) => void;
  pages: AdminPages;
  onPages: (update: (current: AdminPages) => AdminPages) => void;
  loading: boolean;
  error: string | null;
  saving: boolean;
  currentUserId: string;
  currentTime: number;
  onAccountAction: (account: AdminUser, action: AccountAction) => void;
  onRevokeInvite: (inviteId: string) => void;
}) {
  const result = data?.[tab];
  return (
    <section className={styles.card}>
      <div
        className={styles.tabs}
        role="tablist"
        aria-label="Gestão da plataforma"
      >
        {adminTabs.map((item) => (
          <button
            type="button"
            role="tab"
            aria-selected={tab === item.key}
            key={item.key}
            onClick={() => onTab(item.key)}
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
                {adminTabs.find((item) => item.key === tab)?.label} da plataforma
              </caption>
              <thead>
                <tr>
                  {columns[tab].map((label) => (
                    <th key={label} scope="col">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tab === "users" &&
                  data.users.data.map((account) => (
                    <UserRow
                      key={account.id}
                      account={account}
                      isSelf={account.id === currentUserId}
                      saving={saving}
                      onAction={(action) => onAccountAction(account, action)}
                    />
                  ))}
                {tab === "plantations" &&
                  data.plantations.data.map((plantation) => (
                    <PlantationRow key={plantation.id} plantation={plantation} />
                  ))}
                {tab === "invites" &&
                  data.invites.data.map((invitation) => (
                    <InviteRow
                      key={invitation.id}
                      invitation={invitation}
                      currentTime={currentTime}
                      saving={saving}
                      onRevoke={() => onRevokeInvite(invitation.id)}
                    />
                  ))}
                {result?.data.length === 0 && (
                  <tr>
                    <td colSpan={columns[tab].length}>
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
                  onPages((current) => ({
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
                  onPages((current) => ({
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
  );
}

function UserRow({
  account,
  isSelf,
  saving,
  onAction,
}: {
  account: AdminUser;
  isSelf: boolean;
  saving: boolean;
  onAction: (action: AccountAction) => void;
}) {
  return (
    <tr>
      <td>
        <strong>{account.name}</strong>
        <small>{account.email}</small>
      </td>
      <td>{account.systemRole === "SUPERADMIN" ? "Superadmin" : "Usuário"}</td>
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
            Desde {new Date(account.blockedAt).toLocaleString("pt-BR")}
          </small>
        )}
      </td>
      <td>
        {account.plantations.length
          ? account.plantations
              .map(
                (membership) =>
                  `${membership.plantation.name} (${roleLabel(membership.role)})`,
              )
              .join(", ")
          : "Sem vínculo"}
      </td>
      <td>
        {isSelf ? (
          <small>Sua conta · gerencie a sessão em Meu perfil.</small>
        ) : (
          <div className={styles.accountActions}>
            {account.systemRole === "SUPERADMIN" ? (
              <small>Bloqueio protegido</small>
            ) : (
              <button
                type="button"
                disabled={saving}
                onClick={() => onAction(account.blockedAt ? "unblock" : "block")}
              >
                {account.blockedAt ? "Desbloquear" : "Bloquear"}
              </button>
            )}
            <button
              type="button"
              disabled={saving}
              onClick={() => onAction("revoke-sessions")}
            >
              Revogar sessões
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

function PlantationRow({ plantation }: { plantation: AdminPlantation }) {
  return (
    <tr>
      <td>
        <strong>{plantation.name}</strong>
      </td>
      <td>{plantation.location ?? "Não informada"}</td>
      <td>{plantation._count.members}</td>
      <td>{plantation._count.devices}</td>
    </tr>
  );
}

function InviteRow({
  invitation,
  currentTime,
  saving,
  onRevoke,
}: {
  invitation: AdminInvite;
  currentTime: number;
  saving: boolean;
  onRevoke: () => void;
}) {
  const pending =
    !invitation.acceptedAt &&
    new Date(invitation.expiresAt).getTime() > currentTime;
  return (
    <tr>
      <td>
        <strong>{invitation.name}</strong>
        <small>{invitation.email}</small>
      </td>
      <td>{roleLabel(invitation.role)}</td>
      <td>{invitation.plantation?.name ?? "Sem vínculo inicial"}</td>
      <td>
        {invitation.acceptedAt ? (
          "Aceito"
        ) : pending ? (
          <>
            <span>Pendente</span>
            <button type="button" disabled={saving} onClick={onRevoke}>
              Revogar
            </button>
          </>
        ) : (
          "Expirado / revogado"
        )}
        <small>
          Validade: {new Date(invitation.expiresAt).toLocaleString("pt-BR")}
        </small>
      </td>
    </tr>
  );
}
