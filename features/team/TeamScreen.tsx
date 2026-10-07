"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth";
import { usePlantations } from "@/features/plantations/context/PlantationContext";
import type { Plantation } from "@/features/plantations/types/plantation.types";
import { DashboardIcon } from "@/features/dashboard/components/dashboard-icons/DashboardIcon";
import { ApiError, apiRequest } from "@/shared/api/api-client";
import styles from "./TeamScreen.module.css";

type Member = {
  id: string;
  role: "OWNER" | "MEMBER";
  joinedAt: string;
  user: { id: string; name: string; email: string };
};
type Invitation = {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "MEMBER";
  createdAt: string;
  expiresAt: string;
};

const date = (value: string) => new Date(value).toLocaleString("pt-BR");
const message = (error: unknown) =>
  error instanceof ApiError
    ? error.message
    : "Não foi possível concluir a solicitação. Tente novamente.";

export function TeamScreen() {
  const { selectedPlantation, status, reloadPlantations } = usePlantations();
  if (status === "error")
    return (
      <main className={styles.page}>
        <h1>Equipe indisponível</h1>
        <p>Não foi possível consultar suas plantações.</p>
        <button type="button" onClick={() => void reloadPlantations()}>
          Tentar novamente
        </button>
      </main>
    );
  if (!selectedPlantation)
    return (
      <main className={styles.page}>
        <h1>Equipe</h1>
        <p>Selecione uma plantação para consultar seus participantes.</p>
        <Link href="/dashboard/plantacoes">Ver plantações</Link>
      </main>
    );
  return (
    <PlantationTeam
      key={`${selectedPlantation.id}:${selectedPlantation.role}`}
      plantation={selectedPlantation}
    />
  );
}

function PlantationTeam({ plantation }: { plantation: Plantation }) {
  const { user } = useAuth();
  const owner = plantation.role === "OWNER";
  const base = `/plantations/${plantation.id}`;
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    Promise.all([
      apiRequest<Member[]>(`${base}/members`),
      owner ? apiRequest<Invitation[]>(`${base}/invites`) : Promise.resolve([]),
    ])
      .then(([participants, invitations]) => {
        if (!active) return;
        setMembers(participants);
        setInvites(invitations);
        setLoadError(null);
      })
      .catch((error: unknown) => {
        if (active) setLoadError(message(error));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [base, owner, revision]);

  function refresh() {
    setLoading(true);
    setRevision((value) => value + 1);
  }

  async function invite(name: string, email: string, id = "create") {
    setBusy(id);
    setActionError(null);
    setSuccess(null);
    try {
      await apiRequest("/invites", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          plantationId: plantation.id,
          role: "MEMBER",
        }),
      });
      setSuccess(`Convite enviado para ${email.trim().toLowerCase()}.`);
      return true;
    } catch (error) {
      setActionError(message(error));
      return false;
    } finally {
      setBusy(null);
      refresh();
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const element = event.currentTarget;
    const form = new FormData(element);
    if (
      await invite(
        String(form.get("name") ?? ""),
        String(form.get("email") ?? ""),
      )
    )
      element.reset();
  }

  async function remove(member: Member) {
    if (
      !window.confirm(
        `Remover ${member.user.name} da equipe de ${plantation.name}? O acesso a esta plantação será encerrado.`,
      )
    )
      return;
    setBusy(member.id);
    setActionError(null);
    setSuccess(null);
    try {
      await apiRequest(`${base}/members/${member.user.id}`, {
        method: "DELETE",
      });
      setSuccess(`${member.user.name} foi removido da equipe.`);
    } catch (error) {
      setActionError(message(error));
    } finally {
      setBusy(null);
      refresh();
    }
  }

  async function revoke(invitation: Invitation) {
    if (
      !window.confirm(
        `Cancelar o convite de ${invitation.email}? O link deixará de funcionar.`,
      )
    )
      return;
    setBusy(invitation.id);
    setActionError(null);
    setSuccess(null);
    try {
      await apiRequest(`${base}/invites/${invitation.id}`, {
        method: "DELETE",
      });
      setSuccess("Convite cancelado.");
    } catch (error) {
      setActionError(message(error));
    } finally {
      setBusy(null);
      refresh();
    }
  }

  const owners = members.filter((member) => member.role === "OWNER").length;
  const disabled = busy !== null || loading;
  return (
    <main className={styles.page}>
      <header className={styles.heading}>
        <div>
          <small>GESTÃO DA PLANTAÇÃO</small>
          <h1>Uma equipe, o mesmo campo</h1>
          <p>
            Participantes de <strong>{plantation.name}</strong>
          </p>
        </div>
        <button type="button" onClick={refresh} disabled={disabled}>
          <DashboardIcon name="refresh" size={16} /> Atualizar
        </button>
      </header>
      <section className={styles.summary} aria-label="Resumo da equipe">
        <span className={styles.teamIcon}>
          <DashboardIcon name="team" size={28} />
        </span>
        <div>
          <strong>{loading ? "…" : members.length}</strong>
          <p>participantes na plantação</p>
        </div>
        <span className={styles.access}>
          {owner ? "Você gerencia esta equipe" : "Você participa desta equipe"}
        </span>
      </section>
      {success && (
        <p className={styles.success} role="status">
          {success}
        </p>
      )}
      {actionError && (
        <p className={styles.error} role="alert">
          {actionError}
        </p>
      )}
      {loadError && (
        <p className={styles.error} role="alert">
          {loadError} Use Atualizar para tentar novamente.
        </p>
      )}
      {loading && <p role="status">Atualizando equipe...</p>}
      {!owner && (
        <p>
          Apenas proprietários podem convidar pessoas e gerenciar o acesso à
          plantação.
        </p>
      )}
      {owner && (
        <section className={styles.card}>
          <div className={styles.cardHeading}>
            <h2>Convidar participante</h2>
            <span>Novo membro</span>
          </div>
          <p>
            O convite funciona para contas novas e para quem já usa a TechSoil.
            O participante terá acesso aos dados desta plantação.
          </p>
          <form className={styles.form} onSubmit={submit}>
            <label>
              Nome
              <input
                name="name"
                minLength={2}
                maxLength={120}
                placeholder="Nome do participante"
                required
                disabled={disabled}
              />
            </label>
            <label>
              E-mail
              <input
                name="email"
                type="email"
                maxLength={254}
                placeholder="pessoa@exemplo.com"
                required
                disabled={disabled}
              />
            </label>
            <button
              className={styles.primary}
              type="submit"
              disabled={disabled}
            >
              {busy === "create" ? "Enviando..." : "Enviar convite"}
            </button>
          </form>
        </section>
      )}
      <section className={styles.card} aria-busy={loading}>
        <h2>Quem cuida da plantação</h2>
        <div className={styles.tableScroll}>
          <table>
            <caption>Participantes e permissões</caption>
            <thead>
              <tr>
                <th>Pessoa</th>
                <th>Acesso</th>
                <th>Na equipe desde</th>
                {owner && <th>Ações</th>}
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id}>
                  <td>
                    <strong>
                      {member.user.name}
                      {member.user.id === user?.id ? " (você)" : ""}
                    </strong>
                    <small>{member.user.email}</small>
                  </td>
                  <td>
                    <span
                      className={
                        member.role === "OWNER" ? styles.owner : styles.member
                      }
                    >
                      {member.role === "OWNER" ? "Proprietário" : "Membro"}
                    </span>
                  </td>
                  <td>{date(member.joinedAt)}</td>
                  {owner && (
                    <td>
                      {member.user.id !== user?.id &&
                      (member.role !== "OWNER" || owners > 1) ? (
                        <button
                          className={styles.danger}
                          type="button"
                          disabled={disabled}
                          onClick={() => void remove(member)}
                        >
                          Remover
                        </button>
                      ) : (
                        <small>
                          {member.role === "OWNER" && owners === 1
                            ? "Último proprietário"
                            : "Sua conta"}
                        </small>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && !loadError && members.length === 0 && (
          <p>Nenhum participante encontrado.</p>
        )}
      </section>
      {owner && (
        <section className={styles.card} aria-busy={loading}>
          <div className={styles.cardHeading}>
            <h2>Convites pendentes</h2>
            <span>{invites.length}</span>
          </div>
          <p>Reenviar gera um novo link e invalida o anterior.</p>
          <div className={styles.tableScroll}>
            <table>
              <caption>Convites aguardando aceite</caption>
              <thead>
                <tr>
                  <th>Pessoa</th>
                  <th>Acesso</th>
                  <th>Válido até</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {invites.map((invitation) => (
                  <tr key={invitation.id}>
                    <td>
                      <strong>{invitation.name}</strong>
                      <small>{invitation.email}</small>
                    </td>
                    <td>
                      {invitation.role === "OWNER" ? "Proprietário" : "Membro"}
                    </td>
                    <td>{date(invitation.expiresAt)}</td>
                    <td>
                      <div className={styles.actions}>
                        {invitation.role === "MEMBER" && (
                          <button
                            type="button"
                            disabled={disabled}
                            onClick={() =>
                              void invite(
                                invitation.name,
                                invitation.email,
                                invitation.id,
                              )
                            }
                          >
                            Reenviar
                          </button>
                        )}
                        <button
                          className={styles.danger}
                          type="button"
                          disabled={disabled}
                          onClick={() => void revoke(invitation)}
                        >
                          Cancelar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && !loadError && invites.length === 0 && (
            <p className={styles.empty}>
              Nenhum convite pendente. As pessoas aparecerão na equipe após
              aceitar o convite.
            </p>
          )}
        </section>
      )}
    </main>
  );
}
