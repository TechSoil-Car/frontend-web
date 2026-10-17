import { apiRequest } from "@/shared/api/api-client";
import type {
  Organization,
  OrganizationInvite,
  OrganizationMember,
  OrganizationRole,
} from "../types";

export type OrganizationPlantation = { id: string; name: string };

const base = (organizationId: string) => `/organizations/${organizationId}`;

export function createOrganization(name: string) {
  return apiRequest<Organization>("/organizations", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function renameOrganization(organizationId: string, name: string) {
  return apiRequest<Organization>(base(organizationId), {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });
}

export function deleteOrganization(organizationId: string) {
  return apiRequest<void>(base(organizationId), { method: "DELETE" });
}

/** Plantations of the organization that the signed-in person can access. */
export async function listOrganizationPlantations(organizationId: string) {
  const organization = await apiRequest<{ plantations: OrganizationPlantation[] }>(base(organizationId));
  return organization.plantations;
}

export function listMembers(organizationId: string) {
  return apiRequest<OrganizationMember[]>(`${base(organizationId)}/members`);
}

export function updateMember(
  organizationId: string,
  userId: string,
  access: { role: OrganizationRole; plantationIds: string[] },
) {
  return apiRequest<void>(`${base(organizationId)}/members/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(access),
  });
}

export function removeMember(organizationId: string, userId: string) {
  return apiRequest<void>(`${base(organizationId)}/members/${userId}`, {
    method: "DELETE",
  });
}

export function listInvites(organizationId: string) {
  return apiRequest<OrganizationInvite[]>(`${base(organizationId)}/invites`);
}

export function revokeInvite(organizationId: string, inviteId: string) {
  return apiRequest<void>(`${base(organizationId)}/invites/${inviteId}`, {
    method: "DELETE",
  });
}

export function inviteMember(invite: {
  organizationId: string;
  name: string;
  email: string;
  role: OrganizationRole;
  plantationId?: string;
}) {
  return apiRequest<void>("/invites", {
    method: "POST",
    body: JSON.stringify(invite),
  });
}
