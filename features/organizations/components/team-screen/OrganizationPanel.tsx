"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { DashboardIcon } from "@/features/dashboard/components/dashboard-icons/DashboardIcon";
import type { OrganizationPlantation } from "../../services/organizations-api";
import { roleLabel, type OrganizationInvite, type OrganizationMembership } from "../../types";
import styles from "./TeamScreen.module.css";

const ROLE_GUIDE = [
  ["OWNER", "Administra a organização, a equipe, plantações e dispositivos."],
  ["OPERATOR", "Ajusta alertas e opera expedições nas plantações atribuídas."],
  ["VIEWER", "Consulta leituras, alertas e o mapa das plantações atribuídas."],
] as const;

export function OrganizationCard({
  membership,
  plantations,
  loading,
  disabled,
  onRename,
}: {
  membership: OrganizationMembership;
  plantations: OrganizationPlantation[];
  loading: boolean;
  disabled: boolean;
  onRename?: (name: string) => Promise<boolean>;
}) {
  const [renaming, setRenaming] = useState(false);
  const owner = membership.role === "OWNER";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = String(new FormData(event.currentTarget).get("name") ?? "").trim();
    if (await onRename?.(name)) setRenaming(false);
  }

  return (
    <section className={styles.panel} aria-label="Organização">
      <p className={styles.panelKicker}>ORGANIZAÇÃO</p>
      {renaming ? (
        <form className={styles.renameForm} onSubmit={submit}>
          <label className={styles.field}>
            Nome da organização
            <input name="name" defaultValue={membership.organization.name} minLength={2} maxLength={120} required disabled={disabled} autoFocus />
          </label>
          <div className={styles.editorActions}>
            <button type="button" className={styles.ghostButton} onClick={() => setRenaming(false)} disabled={disabled}>Cancelar</button>
            <button type="submit" className={styles.primaryButton} disabled={disabled}>Salvar nome</button>
          </div>
        </form>
      ) : (
        <div className={styles.organizationName}>
          <h2>{membership.organization.name}</h2>
          {owner && onRename && (
            <button type="button" className={styles.linkButton} onClick={() => setRenaming(true)} disabled={disabled}>Renomear</button>
          )}
        </div>
      )}
      <p className={styles.yourAccess}>Seu acesso: {roleLabel(membership.role)}.</p>

      {!owner && !loading && (
        <div className={styles.assigned}>
          {plantations.length ? (
            <>
              <small>{plantations.length === 1 ? "Plantação atribuída" : `${plantations.length} plantações atribuídas`}</small>
              <ul>{plantations.map((plantation) => <li key={plantation.id}><DashboardIcon name="field" size={14} /> {plantation.name}</li>)}</ul>
            </>
          ) : (
            <p>Nenhuma plantação atribuída. Solicite acesso ao proprietário.</p>
          )}
        </div>
      )}

      <ul className={styles.roleGuide}>
        {ROLE_GUIDE.map(([role, description]) => (
          <li key={role}>
            <span className={`${styles.roleBadge} ${styles[`role${role}`]}`}>{roleLabel(role)}</span>
            <p>{description}</p>
          </li>
        ))}
      </ul>
      <Link className={styles.panelLink} href="/dashboard/plantacoes">
        Abrir plantações desta organização <DashboardIcon name="arrow" size={14} />
      </Link>
    </section>
  );
}

export function PendingInvites({
  invites,
  loading,
  disabled,
  onRevoke,
}: {
  invites: OrganizationInvite[];
  loading: boolean;
  disabled: boolean;
  onRevoke: (invite: OrganizationInvite) => void;
}) {
  return (
    <section className={styles.panel} aria-label="Convites pendentes">
      <div className={styles.panelHeading}>
        <h2>Convites pendentes</h2>
        <span className={styles.countPill}>{invites.length}</span>
      </div>
      {invites.length ? (
        <ul className={styles.inviteList}>
          {invites.map((invite) => (
            <li key={invite.id}>
              <div>
                <strong>{invite.name}</strong>
                <p>{invite.email}</p>
                <small>{roleLabel(invite.role)} · expira {new Date(invite.expiresAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</small>
              </div>
              <button type="button" className={styles.linkButton} disabled={disabled} onClick={() => onRevoke(invite)}>Cancelar convite</button>
            </li>
          ))}
        </ul>
      ) : (
        !loading && <p className={styles.panelEmpty}>Nenhum convite pendente.</p>
      )}
    </section>
  );
}

export function DangerZone({
  organizationName,
  plantationCount,
  disabled,
  onDelete,
}: {
  organizationName: string;
  plantationCount: number;
  disabled: boolean;
  onDelete: () => void;
}) {
  const [confirmation, setConfirmation] = useState("");
  return (
    <details className={styles.danger}>
      <summary>Excluir organização</summary>
      <p>
        {plantationCount
          ? `Remova as ${plantationCount} plantações antes de excluir. A exclusão encerra os vínculos da equipe.`
          : "A exclusão encerra os vínculos da equipe e não pode ser desfeita."}
      </p>
      <label className={styles.field}>
        Digite {organizationName} para confirmar
        <input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} disabled={disabled} />
      </label>
      <button type="button" className={styles.deleteButton} disabled={disabled || confirmation.trim() !== organizationName} onClick={onDelete}>
        Excluir organização
      </button>
    </details>
  );
}
