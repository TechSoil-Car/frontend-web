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

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";
