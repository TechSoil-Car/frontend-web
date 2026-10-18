export type OrganizationRole = "OWNER" | "OPERATOR" | "VIEWER" | "MEMBER";
export type Organization = { id: string; name: string; createdAt: string };
export type OrganizationMembership = {
  role: OrganizationRole;
  organization: Organization;
};
export type OrganizationMember = {
  id: string;
  role: OrganizationRole;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    plantations: { plantationId: string }[];
  };
};
export type OrganizationInvite = {
  id: string;
  name: string;
  email: string;
  role: OrganizationRole;
  expiresAt: string;
};
export const roleLabel = (role: OrganizationRole) =>
  ({
    OWNER: "Proprietário",
    OPERATOR: "Operador",
    VIEWER: "Visualizador",
    MEMBER: "Visualizador",
  })[role];
export const canOperate = (role: OrganizationRole) =>
  role === "OWNER" || role === "OPERATOR";
