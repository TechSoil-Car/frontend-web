"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth";
import { usePlantations } from "@/features/plantations/context/PlantationContext";
import { ApiError, apiRequest } from "@/shared/api/api-client";
import { useOrganizations } from "./OrganizationContext";
import {
  roleLabel,
  type Organization,
  type OrganizationMember,
  type OrganizationInvite,
  type OrganizationMembership,
} from "./types";
import styles from "./OrganizationsScreen.module.css";
const message = (error: unknown) =>
  error instanceof ApiError
    ? error.message
    : "Não foi possível concluir. Confira sua conexão e tente novamente.";
const field = (form: FormData, name: string) =>
  String(form.get(name) ?? "").trim();
const roles = (
  <>
    <option value="VIEWER">Visualizador</option>
    <option value="OPERATOR">Operador</option>
    <option value="OWNER">Proprietário</option>
  </>
);

export function OrganizationSelector() {
  const { memberships, selected, status, selectOrganization } =
    useOrganizations();
  return (
    <label className={styles.selector}>
      Organização
      <select
        value={selected?.organization.id ?? ""}
        disabled={status !== "ready"}
        onChange={(event) => selectOrganization(event.target.value)}
      >
        <option value="" disabled>
          {status === "loading" ? "Carregando..." : "Selecione uma organização"}
        </option>
        {memberships.map((item) => (
          <option key={item.organization.id} value={item.organization.id}>
            {item.organization.name} · {roleLabel(item.role)}
          </option>
        ))}
      </select>
    </label>
  );
}
export function OrganizationsScreen() {
  const { selected, status, error, reloadOrganizations } = useOrganizations();
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const element = event.currentTarget;
    setBusy(true);
    setActionError(null);
    try {
      const created = await apiRequest<Organization>("/organizations", {
        method: "POST",
        body: JSON.stringify({ name: field(new FormData(element), "name") }),
      });
      element.reset();
      await reloadOrganizations(created.id);
    } catch (error) {
      setActionError(message(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className={styles.page}>
      <header>
        <h1>Organizações e equipe</h1>
        <p>
          Cada organização representa um cliente e reúne suas plantações e
          participantes.
        </p>
      </header>
      <OrganizationSelector />
      <button
        disabled={busy || status === "loading"}
        onClick={() => void reloadOrganizations()}
      >
        Atualizar organizações e permissões
      </button>
      {error && <p role="alert">{error}</p>}
      {actionError && <p role="alert">{actionError}</p>}
      <section className={styles.card}>
        <h2>Criar organização</h2>
        <form onSubmit={create}>
          <label>
            Nome
            <input
              name="name"
              minLength={2}
              maxLength={120}
              required
              disabled={busy}
            />
          </label>
          <button disabled={busy}>
            {busy ? "Criando..." : "Criar organização"}
          </button>
        </form>
      </section>
      {status === "loading" ? (
        <p role="status">Carregando permissões...</p>
      ) : selected ? (
        <OrganizationDetails
          key={`${selected.organization.id}:${selected.role}`}
          membership={selected}
        />
      ) : (
        status === "ready" && (
          <p>
            Você ainda não participa de uma organização. Crie uma ou aceite um
            convite.
          </p>
        )
      )}
    </main>
  );
}
function OrganizationDetails({
  membership,
}: {
  membership: OrganizationMembership;
}) {
  const { user } = useAuth();
  const { reloadOrganizations } = useOrganizations();
  const { reloadPlantations } = usePlantations();
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [invites, setInvites] = useState<OrganizationInvite[]>([]);
  const [farms, setFarms] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const owner = membership.role === "OWNER";
  const base = `/organizations/${membership.organization.id}`;
  useEffect(() => {
    let active = true;
    Promise.all([
      apiRequest<{ plantations: { id: string; name: string }[] }>(base),
      owner
        ? apiRequest<OrganizationMember[]>(`${base}/members`)
        : Promise.resolve([]),
      owner
        ? apiRequest<OrganizationInvite[]>(`${base}/invites`)
        : Promise.resolve([]),
    ])
      .then(([organization, members, invites]) => {
        if (active) {
          setFarms(organization.plantations);
          setMembers(members);
          setInvites(invites);
          setError(null);
        }
      })
      .catch((error) => {
        if (active) {
          setMembers([]);
          setInvites([]);
          setFarms([]);
          setError(message(error));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [base, owner, revision]);
  async function mutate(
    path: string,
    method: string,
    body?: unknown,
    refreshOrganization = false,
  ) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await apiRequest(path, {
        method,
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      setNotice("Alteração concluída.");
      if (refreshOrganization) await reloadOrganizations();
      else {
        setLoading(true);
        setRevision((value) => value + 1);
      }
      await reloadPlantations();
      return true;
    } catch (error) {
      setError(message(error));
      return false;
    } finally {
      setBusy(false);
    }
  }
  const disabled = busy || loading;
  return (
    <>
      <section className={styles.card}>
        <h2>{membership.organization.name}</h2>
        <p>Seu acesso: {roleLabel(membership.role)}.</p>
        <p>
          Proprietários administram a organização. Operadores ajustam alertas
          nas plantações atribuídas. Visualizadores consultam os dados.
        </p>
        <Link href="/dashboard/plantacoes">
          Abrir plantações desta organização
        </Link>
        {!owner && !loading && (
          <p>
            {farms.length
              ? `${farms.length} plantação(ões) atribuída(s).`
              : "Nenhuma plantação atribuída. Solicite acesso ao proprietário."}
          </p>
        )}
      </section>
      {notice && <p role="status">{notice}</p>}
      {error && <p role="alert">{error}</p>}
      <button
        disabled={disabled}
        onClick={() => {
          setLoading(true);
          setRevision((value) => value + 1);
        }}
      >
        Atualizar equipe
      </button>
      {loading && <p role="status">Carregando organização...</p>}
      {owner && (
        <>
          <section className={styles.card}>
            <h2>Nome da organização</h2>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void mutate(
                  base,
                  "PATCH",
                  { name: field(new FormData(event.currentTarget), "name") },
                  true,
                );
              }}
            >
              <label>
                Nome
                <input
                  name="name"
                  defaultValue={membership.organization.name}
                  minLength={2}
                  maxLength={120}
                  required
                  disabled={disabled}
                />
              </label>
              <button disabled={disabled}>Salvar nome</button>
            </form>
          </section>
          <section className={styles.card}>
            <h2>Convidar participante</h2>
            <p>
              O convite é enviado por email. Participantes existentes mantêm seu
              papel; altere permissões na equipe.
            </p>
            <form
              onSubmit={async (event) => {
                event.preventDefault();
                const element = event.currentTarget;
                const form = new FormData(element);
                const plantationId = field(form, "plantationId");
                if (
                  await mutate("/invites", "POST", {
                    organizationId: membership.organization.id,
                    name: field(form, "name"),
                    email: field(form, "email"),
                    role: field(form, "role"),
                    ...(plantationId ? { plantationId } : {}),
                  })
                )
                  element.reset();
              }}
            >
              <label>
                Nome
                <input
                  name="name"
                  minLength={2}
                  maxLength={120}
                  required
                  disabled={disabled}
                />
              </label>
              <label>
                Email
                <input
                  name="email"
                  type="email"
                  maxLength={254}
                  required
                  disabled={disabled}
                />
              </label>
              <label>
                Papel
                <select name="role" defaultValue="VIEWER" disabled={disabled}>
                  {roles}
                </select>
              </label>
              <label>
                Plantação inicial
                <select name="plantationId" disabled={disabled}>
                  <option value="">
                    Somente organização (atribuir depois)
                  </option>
                  {farms.map((farm) => (
                    <option key={farm.id} value={farm.id}>
                      {farm.name}
                    </option>
                  ))}
                </select>
              </label>
              <p>
                Proprietários recebem todas as plantações. Para os demais,
                atribua acesso após o aceite.
              </p>
              <button disabled={disabled}>Enviar convite</button>
            </form>
          </section>
          <section className={styles.card}>
            <h2>Equipe</h2>
            {members.map((member) => (
              <form
                className={styles.member}
                key={`${member.id}:${revision}`}
                onSubmit={(event) => {
                  event.preventDefault();
                  const form = new FormData(event.currentTarget);
                  const role = field(form, "role");
                  if (
                    (role === "OWNER" || member.user.id === user?.id) &&
                    !window.confirm(
                      `Aplicar ${roleLabel(role as OrganizationMember["role"])} a ${member.user.name}? Proprietários têm acesso completo.`,
                    )
                  )
                    return;
                  void mutate(
                    `${base}/members/${member.user.id}`,
                    "PATCH",
                    { role, plantationIds: form.getAll("plantationIds") },
                    member.user.id === user?.id,
                  );
                }}
              >
                <h3>
                  {member.user.name}
                  {member.user.id === user?.id ? " (você)" : ""}
                </h3>
                <p>{member.user.email}</p>
                <label>
                  Papel
                  <select
                    name="role"
                    defaultValue={
                      member.role === "MEMBER" ? "VIEWER" : member.role
                    }
                    disabled={disabled}
                  >
                    {roles}
                  </select>
                </label>
                <fieldset disabled={disabled}>
                  <legend>
                    Plantações atribuídas (proprietários recebem todas)
                  </legend>
                  {farms.map((farm) => (
                    <label className={styles.check} key={farm.id}>
                      <input
                        type="checkbox"
                        name="plantationIds"
                        value={farm.id}
                        defaultChecked={member.user.plantations.some(
                          (item) => item.plantationId === farm.id,
                        )}
                      />
                      {farm.name}
                    </label>
                  ))}
                </fieldset>
                <div className={styles.actions}>
                  <button disabled={disabled}>Salvar acesso</button>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      if (
                        window.confirm(
                          `Remover ${member.user.name} de toda a organização e suas plantações?`,
                        )
                      )
                        void mutate(
                          `${base}/members/${member.user.id}`,
                          "DELETE",
                          undefined,
                          member.user.id === user?.id,
                        );
                    }}
                  >
                    Remover participante
                  </button>
                </div>
              </form>
            ))}
          </section>
          <section className={styles.card}>
            <h2>Convites pendentes</h2>
            {invites.map((invite) => (
              <div className={styles.member} key={invite.id}>
                <p>
                  {invite.name} · {invite.email} · {roleLabel(invite.role)}
                </p>
                <p>
                  Expira em {new Date(invite.expiresAt).toLocaleString("pt-BR")}
                </p>
                <button
                  disabled={disabled}
                  onClick={() => {
                    if (
                      window.confirm(`Cancelar o convite de ${invite.email}?`)
                    )
                      void mutate(`${base}/invites/${invite.id}`, "DELETE");
                  }}
                >
                  Cancelar convite
                </button>
              </div>
            ))}
            {!loading && invites.length === 0 && (
              <p>Nenhum convite pendente.</p>
            )}
          </section>
          <section className={styles.card}>
            <h2>Excluir organização</h2>
            <p>
              Remova todas as plantações antes. A exclusão encerra os vínculos
              da equipe.
            </p>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (
                  field(new FormData(event.currentTarget), "confirmation") !==
                  membership.organization.name
                ) {
                  setError("Digite o nome exato da organização.");
                  return;
                }
                if (window.confirm("Excluir definitivamente esta organização?"))
                  void mutate(base, "DELETE", undefined, true);
              }}
            >
              <label>
                Digite {membership.organization.name}
                <input name="confirmation" required disabled={disabled} />
              </label>
              <button disabled={disabled}>Excluir organização</button>
            </form>
          </section>
        </>
      )}
    </>
  );
}
