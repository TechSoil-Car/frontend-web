"use client";

import { useState, type FormEvent } from "react";
import { Modal } from "@/shared/components/modal/Modal";
import modal from "@/shared/components/modal/Modal.module.css";
import { errorMessage } from "../../hooks/use-organization-team";
import type { OrganizationPlantation } from "../../services/organizations-api";
import * as organizationsApi from "../../services/organizations-api";
import type { OrganizationRole } from "../../types";
import styles from "./TeamScreen.module.css";

const field = (form: FormData, name: string) => String(form.get(name) ?? "").trim();

export function RoleOptions() {
  return (
    <>
      <option value="VIEWER">Visualizador</option>
      <option value="OPERATOR">Operador</option>
      <option value="OWNER">Proprietário</option>
    </>
  );
}

export function CreateOrganizationDialog({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const created = await organizationsApi.createOrganization(field(new FormData(event.currentTarget), "name"));
      await onCreated(created.id);
      onClose();
    } catch (reason) {
      setError(errorMessage(reason));
      setBusy(false);
    }
  }
  return (
    <Modal kicker="NOVO CLIENTE" title="Nova organização" busy={busy} onClose={onClose}>
      <p className={modal.intro}>Cada organização representa um cliente e reúne suas plantações e participantes. Você será o proprietário.</p>
      <form className={modal.form} onSubmit={submit}>
        <label htmlFor="organization-name">Nome da organização</label>
        <input id="organization-name" name="name" minLength={2} maxLength={120} required disabled={busy} autoFocus />
        {error && <p className={modal.error} role="alert">{error}</p>}
        <footer className={modal.actions}>
          <button type="button" onClick={onClose} disabled={busy}>Cancelar</button>
          <button type="submit" disabled={busy}>{busy ? "Criando..." : "Criar organização"}</button>
        </footer>
      </form>
    </Modal>
  );
}

export function InviteDialog({
  organizationId,
  plantations,
  error,
  onClose,
  onInvite,
}: {
  organizationId: string;
  plantations: OrganizationPlantation[];
  error: string | null;
  onClose: () => void;
  onInvite: (invite: Parameters<typeof organizationsApi.inviteMember>[0]) => Promise<boolean>;
}) {
  const [busy, setBusy] = useState(false);
  const [role, setRole] = useState<OrganizationRole>("VIEWER");
  // Only errors from this dialog's own attempt are shown here.
  const [attempted, setAttempted] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const plantationId = field(form, "plantationId");
    setAttempted(true);
    setBusy(true);
    const sent = await onInvite({
      organizationId,
      name: field(form, "name"),
      email: field(form, "email"),
      role,
      ...(plantationId && role !== "OWNER" ? { plantationId } : {}),
    });
    setBusy(false);
    if (sent) onClose();
  }
  return (
    <Modal kicker="NOVO CONVITE" title="Convidar participante" busy={busy} onClose={onClose}>
      <p className={modal.intro}>O convite é enviado por email e vale por 24 horas. Quem já tem conta confirma com a senha atual.</p>
      <form className={modal.form} onSubmit={submit}>
        <label htmlFor="invite-name">Nome</label>
        <input id="invite-name" name="name" minLength={2} maxLength={120} required disabled={busy} autoFocus />
        <label htmlFor="invite-email">Email</label>
        <input id="invite-email" name="email" type="email" maxLength={254} required disabled={busy} />
        <label htmlFor="invite-role">Papel</label>
        <select id="invite-role" className={styles.dialogSelect} value={role} onChange={(event) => setRole(event.target.value as OrganizationRole)} disabled={busy}>
          <RoleOptions />
        </select>
        {role === "OWNER" ? (
          <small>Proprietários recebem acesso a todas as plantações e administram a equipe.</small>
        ) : (
          <>
            <label htmlFor="invite-plantation">Plantação inicial</label>
            <select id="invite-plantation" name="plantationId" className={styles.dialogSelect} disabled={busy}>
              <option value="">Somente organização (atribuir depois)</option>
              {plantations.map((plantation) => (
                <option key={plantation.id} value={plantation.id}>{plantation.name}</option>
              ))}
            </select>
            <small>Outras plantações podem ser atribuídas depois do aceite.</small>
          </>
        )}
        {attempted && !busy && error && <p className={modal.error} role="alert">{error}</p>}
        <footer className={modal.actions}>
          <button type="button" onClick={onClose} disabled={busy}>Cancelar</button>
          <button type="submit" disabled={busy}>{busy ? "Enviando..." : "Enviar convite"}</button>
        </footer>
      </form>
    </Modal>
  );
}

export type Confirmation = {
  kicker: string;
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  action: () => Promise<unknown>;
};

export function ConfirmDialog({ confirmation, onClose }: { confirmation: Confirmation; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <Modal kicker={confirmation.kicker} title={confirmation.title} busy={busy} onClose={onClose}>
      <p className={modal.note}>{confirmation.message}</p>
      <footer className={modal.actions}>
        <button type="button" onClick={onClose} disabled={busy}>Cancelar</button>
        <button
          type="submit"
          className={confirmation.danger ? modal.danger : undefined}
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await confirmation.action();
            onClose();
          }}
        >
          {confirmation.confirmLabel}
        </button>
      </footer>
    </Modal>
  );
}
