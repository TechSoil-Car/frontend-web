export type PageResult<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
};
export type AdminUser = {
  id: string;
  name: string;
  email: string;
  systemRole: "USER" | "SUPERADMIN";
  activatedAt: string | null;
  blockedAt: string | null;
  plantations: {
    role: "OWNER" | "OPERATOR" | "VIEWER" | "MEMBER";
    plantation: { id: string; name: string };
  }[];
};
export type AdminPlantation = {
  id: string;
  name: string;
  location: string | null;
  _count: { members: number; devices: number };
};
export type AdminInvite = {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "OPERATOR" | "VIEWER" | "MEMBER";
  expiresAt: string;
  acceptedAt: string | null;
  plantation: { id: string; name: string } | null;
};
export type AdminOverview = {
  users: number;
  activeUsers: number;
  plantations: number;
  pendingInvites: number;
};
export type AdminData = {
  overview: AdminOverview;
  users: PageResult<AdminUser>;
  plantations: PageResult<AdminPlantation>;
  invites: PageResult<AdminInvite>;
};
export type AdminTab = "users" | "plantations" | "invites";
export type AdminPages = Record<AdminTab, number>;
export type AdminInviteInput = {
  name: string;
  email: string;
  role: string;
  plantationId?: string;
};
export type AccountAction = "block" | "unblock" | "revoke-sessions";
