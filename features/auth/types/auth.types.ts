export type AuthUser = {
  id: string;
  name: string;
  email: string;
  systemRole: "USER" | "SUPERADMIN";
};

export type AuthResponse = {
  access_token: string;
  user: AuthUser;
};

export type LoginCredentials = {
  email: string;
  password: string;
};

/** "unavailable": the session could not be checked (server/network); it is kept. */
export type AuthStatus = "loading" | "authenticated" | "unauthenticated" | "unavailable";

export type InvitePreview = {
  name: string;
  email: string;
  plantationName: string | null;
  requiresActivation: boolean;
};
