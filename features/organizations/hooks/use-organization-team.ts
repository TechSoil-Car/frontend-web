"use client";

import { useCallback, useEffect, useState } from "react";
import { usePlantations } from "@/features/plantations/context/PlantationContext";
import { ApiError } from "@/shared/api/api-client";
import { useOrganizations } from "../OrganizationContext";
import * as organizationsApi from "../services/organizations-api";
import type { OrganizationPlantation } from "../services/organizations-api";
import type { OrganizationInvite, OrganizationMember, OrganizationMembership } from "../types";

export const errorMessage = (error: unknown) =>
  error instanceof ApiError
    ? error.message
    : "Não foi possível concluir. Confira sua conexão e tente novamente.";

/**
 * Team data of one organization. Members and invites are only requested by
 * owners; the server remains the authority for every change.
 */
export function useOrganizationTeam(membership: OrganizationMembership) {
  const { reloadOrganizations } = useOrganizations();
  const { reloadPlantations } = usePlantations();
  const organizationId = membership.organization.id;
  const owner = membership.role === "OWNER";
  const [plantations, setPlantations] = useState<OrganizationPlantation[]>([]);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [invites, setInvites] = useState<OrganizationInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    Promise.all([
      organizationsApi.listOrganizationPlantations(organizationId),
      owner ? organizationsApi.listMembers(organizationId) : Promise.resolve([]),
      owner ? organizationsApi.listInvites(organizationId) : Promise.resolve([]),
    ])
      .then(([nextPlantations, nextMembers, nextInvites]) => {
        if (!active) return;
        setPlantations(nextPlantations);
        setMembers(nextMembers);
        setInvites(nextInvites);
        setError(null);
      })
      .catch((reason) => {
        if (!active) return;
        setPlantations([]);
        setMembers([]);
        setInvites([]);
        setError(errorMessage(reason));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [organizationId, owner, revision]);

  const reload = useCallback(() => {
    setLoading(true);
    setRevision((value) => value + 1);
  }, []);

  /**
   * Runs a change and refreshes what it affects. Changes to one's own access
   * or to the organization itself reload the organization list (and remount).
   */
  const mutate = useCallback(
    async (change: () => Promise<unknown>, { success = "Alteração concluída.", refreshOrganization = false } = {}) => {
      setBusy(true);
      setError(null);
      setNotice(null);
      try {
        await change();
        setNotice(success);
        if (refreshOrganization) await reloadOrganizations();
        else reload();
        await reloadPlantations();
        return true;
      } catch (reason) {
        setError(errorMessage(reason));
        return false;
      } finally {
        setBusy(false);
      }
    },
    [reload, reloadOrganizations, reloadPlantations],
  );

  return { owner, plantations, members, invites, loading, busy, error, notice, revision, reload, mutate, setError };
}
