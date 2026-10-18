import { apiRequest } from "@/shared/api/api-client";
import type {
  AccountAction,
  AdminData,
  AdminInvite,
  AdminInviteInput,
  AdminOverview,
  AdminPages,
  AdminPlantation,
  AdminUser,
  PageResult,
} from "../types/admin.types";

/** Resumo e a página atual de cada aba, em paralelo. */
export async function getAdminData(pages: AdminPages): Promise<AdminData> {
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
  return { overview, users, plantations, invites };
}

export function inviteUser(invite: AdminInviteInput) {
  return apiRequest<void>("/admin/invites", {
    method: "POST",
    body: JSON.stringify(invite),
  });
}

export function revokeAdminInvite(inviteId: string) {
  return apiRequest<void>(`/admin/invites/${inviteId}`, { method: "DELETE" });
}

export function runAccountAction(userId: string, action: AccountAction) {
  return apiRequest<{ message: string }>(
    `/admin/users/${encodeURIComponent(userId)}/${action}`,
    { method: "POST" },
  );
}
