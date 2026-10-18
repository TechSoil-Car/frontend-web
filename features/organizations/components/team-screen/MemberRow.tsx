"use client";

import { useId, useState, type FormEvent } from "react";
import type { OrganizationPlantation } from "../../services/organizations-api";
import { roleLabel, type OrganizationMember, type OrganizationRole } from "../../types/organization.types";
import { RoleOptions } from "./TeamDialogs";
import styles from "./TeamScreen.module.css";

export const initials = (name: string) =>
  name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

const effectiveRole = (role: OrganizationRole) => (role === "MEMBER" ? "VIEWER" : role);

type Props = {
  member: OrganizationMember;
  isSelf: boolean;
  plantations: OrganizationPlantation[];
  disabled: boolean;
  onSave: (member: OrganizationMember, access: { role: OrganizationRole; plantationIds: string[] }) => void;
  onRemove: (member: OrganizationMember) => void;
};

export function MemberRow({ member, isSelf, plantations, disabled, onSave, onRemove }: Props) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<OrganizationRole>(effectiveRole(member.role));
  const editorId = useId();
  const current = effectiveRole(member.role);
  const assigned = plantations.filter((plantation) => member.user.plantations.some((item) => item.plantationId === plantation.id));

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSave(member, { role, plantationIds: form.getAll("plantationIds").map(String) });
  }

  return (
    <article className={`${styles.member} ${open ? styles.memberOpen : ""}`}>
      <div className={styles.memberSummary}>
        <span className={`${styles.avatar} ${styles[`avatar${current}`]}`} aria-hidden="true">{initials(member.user.name)}</span>
        <div className={styles.memberIdentity}>
          <h3>{member.user.name}{isSelf ? " (você)" : ""}</h3>
          <p>{member.user.email}</p>
        </div>
        <span className={`${styles.roleBadge} ${styles[`role${current}`]}`}>{roleLabel(current)}</span>
        <div className={styles.memberFarms}>
          {current === "OWNER" ? (
            <span className={styles.farmChip}>Todas as plantações</span>
          ) : assigned.length ? (
            assigned.map((plantation) => <span className={styles.farmChip} key={plantation.id}>{plantation.name}</span>)
          ) : (
            <span className={`${styles.farmChip} ${styles.farmChipEmpty}`}>Sem plantações</span>
          )}
        </div>
        <button type="button" className={styles.manageButton} aria-expanded={open} aria-controls={editorId} onClick={() => setOpen((value) => !value)}>
          {open ? "Fechar" : "Gerenciar acesso"}
        </button>
      </div>
      {open && (
        <form id={editorId} className={styles.memberEditor} onSubmit={submit}>
          <label className={styles.field}>
            Papel
            <select name="role" value={role} onChange={(event) => setRole(event.target.value as OrganizationRole)} disabled={disabled}>
              <RoleOptions />
            </select>
          </label>
          <fieldset disabled={disabled || role === "OWNER"} className={styles.farmPicker}>
            <legend>{role === "OWNER" ? "Proprietários acessam todas as plantações" : "Plantações atribuídas"}</legend>
            {plantations.length ? (
              plantations.map((plantation) => (
                <label className={styles.farmOption} key={plantation.id}>
                  <input
                    type="checkbox"
                    name="plantationIds"
                    value={plantation.id}
                    defaultChecked={member.user.plantations.some((item) => item.plantationId === plantation.id)}
                  />
                  <span>{plantation.name}</span>
                </label>
              ))
            ) : (
              <small>Esta organização ainda não tem plantações.</small>
            )}
          </fieldset>
          <div className={styles.editorActions}>
            <button type="button" className={styles.removeButton} disabled={disabled} onClick={() => onRemove(member)}>
              Remover participante
            </button>
            <button type="submit" className={styles.primaryButton} disabled={disabled}>Salvar acesso</button>
          </div>
        </form>
      )}
    </article>
  );
}
