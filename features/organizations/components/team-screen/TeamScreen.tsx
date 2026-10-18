"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/features/auth";
import { DashboardIcon } from "@/features/dashboard/components/dashboard-icons/DashboardIcon";
import { useOrganizations } from "../../OrganizationContext";
import { useOrganizationTeam } from "../../hooks/use-organization-team";
import * as organizationsApi from "../../services/organizations-api";
import { roleLabel, type OrganizationMember, type OrganizationMembership, type OrganizationRole } from "../../types";
import { MemberRow } from "./MemberRow";
import { DangerZone, OrganizationCard, PendingInvites } from "./OrganizationPanel";
import { ConfirmDialog, CreateOrganizationDialog, InviteDialog, type Confirmation } from "./TeamDialogs";
import styles from "./TeamScreen.module.css";
import { EmptyState, LoadingState } from "@/shared/components/empty-state/EmptyState";

type RoleFilter = "all" | "OWNER" | "OPERATOR" | "VIEWER";
const FILTERS: { value: RoleFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "OWNER", label: "Proprietários" },
  { value: "OPERATOR", label: "Operadores" },
  { value: "VIEWER", label: "Visualizadores" },
];
const effectiveRole = (role: OrganizationRole) => (role === "MEMBER" ? "VIEWER" : role);

export function TeamScreen() {
  const { selected, status, error, reloadOrganizations } = useOrganizations();
  const [creating, setCreating] = useState(false);
  const [inviting, setInviting] = useState(false);
  const owner = selected?.role === "OWNER";

  return (
    <main className={styles.page}>
      <header className={styles.heading}>
        <div>
          <p>GESTÃO DA EQUIPE</p>
          <h1>Equipe</h1>
          <span>{selected ? `Pessoas e permissões de ${selected.organization.name}.` : "Organize clientes, pessoas e permissões."}</span>
        </div>
        <div className={styles.headingActions}>
          <button type="button" className={styles.secondaryButton} onClick={() => setCreating(true)}>
            <b>+</b> Nova organização
          </button>
          {owner && (
            <button type="button" className={styles.addButton} onClick={() => setInviting(true)}>
              <DashboardIcon name="team" size={17} /> Convidar pessoa
            </button>
          )}
        </div>
      </header>

      {error && <p className={styles.alert} role="alert">{error}</p>}
      {status === "loading" ? (
        <LoadingState variant="inline" title="Carregando permissões..." />
      ) : selected ? (
        <TeamWorkspace key={`${selected.organization.id}:${selected.role}`} membership={selected} inviting={inviting} onInviteClose={() => setInviting(false)} />
      ) : (
        status === "ready" && (
          <div className={styles.emptyBlock}>
            <EmptyState
              art="team"
              title="Você ainda não participa de uma organização"
              text="Crie uma organização para o seu cliente ou aceite um convite recebido por email."
            >
              <button type="button" className={styles.addButton} onClick={() => setCreating(true)}><b>+</b> Nova organização</button>
            </EmptyState>
          </div>
        )
      )}

      {creating && <CreateOrganizationDialog onClose={() => setCreating(false)} onCreated={(id) => reloadOrganizations(id)} />}
    </main>
  );
}

function TeamWorkspace({ membership, inviting, onInviteClose }: { membership: OrganizationMembership; inviting: boolean; onInviteClose: () => void }) {
  const { user } = useAuth();
  const team = useOrganizationTeam(membership);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<RoleFilter>("all");
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const organizationId = membership.organization.id;
  const disabled = team.busy || team.loading;

  const counts = useMemo(() => {
    const result = { OWNER: 0, OPERATOR: 0, VIEWER: 0 };
    team.members.forEach((member) => result[effectiveRole(member.role) as keyof typeof result]++);
    return result;
  }, [team.members]);
  const visibleMembers = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("pt-BR");
    return team.members
      .filter((member) => filter === "all" || effectiveRole(member.role) === filter)
      .filter((member) => !term || `${member.user.name} ${member.user.email}`.toLocaleLowerCase("pt-BR").includes(term))
      .sort((a, b) => Number(b.user.id === user?.id) - Number(a.user.id === user?.id) || a.user.name.localeCompare(b.user.name, "pt-BR"));
  }, [filter, query, team.members, user?.id]);

  function saveAccess(member: OrganizationMember, access: { role: OrganizationRole; plantationIds: string[] }) {
    const self = member.user.id === user?.id;
    const run = () => team.mutate(() => organizationsApi.updateMember(organizationId, member.user.id, access), { refreshOrganization: self });
    if (access.role === "OWNER" && effectiveRole(member.role) !== "OWNER")
      return setConfirmation({ kicker: "PROMOVER PARTICIPANTE", title: `Tornar ${member.user.name} proprietário?`, message: "Proprietários têm acesso completo: administram a equipe, todas as plantações e podem excluir a organização.", confirmLabel: "Promover", action: run });
    if (self && access.role !== effectiveRole(member.role))
      return setConfirmation({ kicker: "SEU ACESSO", title: `Mudar seu papel para ${roleLabel(access.role)}?`, message: "Você pode perder permissões de administração imediatamente.", confirmLabel: "Aplicar", danger: true, action: run });
    void run();
  }

  const summary = [
    { label: "PARTICIPANTES", value: team.members.length, hint: "na organização", icon: "team" },
    { label: "PROPRIETÁRIOS", value: counts.OWNER, hint: "acesso completo", icon: "settings" },
    { label: "OPERADORES E VISUALIZADORES", value: counts.OPERATOR + counts.VIEWER, hint: `${counts.OPERATOR} operadores · ${counts.VIEWER} visualizadores`, icon: "sensor" },
    { label: "CONVITES PENDENTES", value: team.invites.length, hint: "aguardando aceite", icon: "bell" },
  ] as const;

  return (
    <>
      {team.notice && <p className={styles.notice} role="status">{team.notice}</p>}
      {team.error && <p className={styles.alert} role="alert">{team.error}</p>}

      {team.owner && (
        <section className={styles.summary} aria-label="Resumo da equipe">
          {summary.map((item) => (
            <article key={item.label}>
              <span className={styles.summaryIcon}><DashboardIcon name={item.icon} size={19} /></span>
              <div>
                <small>{item.label}</small>
                <strong>{team.loading ? "—" : item.value}</strong>
                <p>{item.hint}</p>
              </div>
            </article>
          ))}
        </section>
      )}

      <div className={`${styles.contentGrid} ${team.owner ? "" : styles.contentSingle}`}>
        {team.owner && (
          <section className={styles.teamList} aria-labelledby="team-heading">
            <div className={styles.toolbar}>
              <div className={styles.toolbarTitle}>
                <h2 id="team-heading">Pessoas</h2>
                <button type="button" className={styles.iconButton} onClick={team.reload} disabled={disabled} aria-label="Atualizar equipe" title="Atualizar equipe">
                  <DashboardIcon name="refresh" size={15} />
                </button>
              </div>
              <label className={styles.search}>
                <DashboardIcon name="search" size={15} />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nome ou email" aria-label="Buscar participante" />
              </label>
              <div className={styles.filters} role="group" aria-label="Filtrar por papel">
                {FILTERS.map((item) => (
                  <button type="button" key={item.value} aria-pressed={filter === item.value} onClick={() => setFilter(item.value)}>{item.label}</button>
                ))}
              </div>
            </div>
            {team.loading && !team.members.length ? (
              <LoadingState variant="inline" title="Carregando equipe..." />
            ) : visibleMembers.length ? (
              <div className={styles.memberList}>
                {visibleMembers.map((member) => (
                  <MemberRow
                    key={`${member.id}:${team.revision}`}
                    member={member}
                    isSelf={member.user.id === user?.id}
                    plantations={team.plantations}
                    disabled={disabled}
                    onSave={saveAccess}
                    onRemove={(target) =>
                      setConfirmation({
                        kicker: "REMOVER PARTICIPANTE",
                        title: `Remover ${target.user.name}?`,
                        message: "O acesso à organização inteira e a todas as plantações é encerrado imediatamente. Convites pendentes desse email também expiram.",
                        confirmLabel: "Remover",
                        danger: true,
                        action: () => team.mutate(() => organizationsApi.removeMember(organizationId, target.user.id), { refreshOrganization: target.user.id === user?.id }),
                      })
                    }
                  />
                ))}
              </div>
            ) : (
              <p className={styles.listEmpty}>Ninguém encontrado com esse filtro.</p>
            )}
          </section>
        )}

        <aside className={styles.aside}>
          <OrganizationCard
            membership={membership}
            plantations={team.plantations}
            loading={team.loading}
            disabled={disabled}
            onRename={team.owner ? (name) => team.mutate(() => organizationsApi.renameOrganization(organizationId, name), { refreshOrganization: true }) : undefined}
          />
          {team.owner && (
            <>
              <PendingInvites
                invites={team.invites}
                loading={team.loading}
                disabled={disabled}
                onRevoke={(invite) =>
                  setConfirmation({
                    kicker: "CONVITE",
                    title: `Cancelar o convite de ${invite.email}?`,
                    message: "O link enviado por email deixa de funcionar.",
                    confirmLabel: "Cancelar convite",
                    danger: true,
                    action: () => team.mutate(() => organizationsApi.revokeInvite(organizationId, invite.id), { success: "Convite cancelado." }),
                  })
                }
              />
              <DangerZone
                organizationName={membership.organization.name}
                plantationCount={team.plantations.length}
                disabled={disabled}
                onDelete={() =>
                  setConfirmation({
                    kicker: "EXCLUSÃO DEFINITIVA",
                    title: `Excluir ${membership.organization.name}?`,
                    message: "A organização e os vínculos da equipe são removidos. Esta ação não pode ser desfeita.",
                    confirmLabel: "Excluir organização",
                    danger: true,
                    action: () => team.mutate(() => organizationsApi.deleteOrganization(organizationId), { refreshOrganization: true }),
                  })
                }
              />
            </>
          )}
        </aside>
      </div>

      {inviting && (
        <InviteDialog
          organizationId={organizationId}
          plantations={team.plantations}
          error={team.error}
          onClose={onInviteClose}
          onInvite={(invite) => team.mutate(() => organizationsApi.inviteMember(invite), { success: `Convite enviado para ${invite.email}.` })}
        />
      )}
      {confirmation && <ConfirmDialog confirmation={confirmation} onClose={() => setConfirmation(null)} />}
    </>
  );
}

