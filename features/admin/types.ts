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
    role: "OWNER" | "MEMBER";
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
  role: "OWNER" | "MEMBER";
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
