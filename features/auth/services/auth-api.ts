import { apiRequest, refreshSession as refreshSharedSession, setAccessToken } from "@/shared/api/api-client";
import type {
  AuthResponse,
  AuthUser,
  InvitePreview,
  LoginCredentials,
} from "../types/auth.types";

export type UserProfile = AuthUser & { createdAt: string };

export function getProfile() {
  return apiRequest<UserProfile>("/users/me");
}

export function updateProfile(name: string) {
  return apiRequest<UserProfile>("/users/me", {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });
}

export function changePassword(currentPassword: string, newPassword: string) {
  return apiRequest<{ message: string }>("/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export async function login(credentials: LoginCredentials) {
  const session = await apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
    authenticated: false,
    retryOnUnauthorized: false,
  });
  setAccessToken(session.access_token);
  return session;
}

/** Restores the session from the HttpOnly cookie; shares the in-flight refresh. */
export function refreshSession() {
  return refreshSharedSession();
}

export async function logout() {
  try {
    await apiRequest<void>("/auth/logout", {
      method: "POST",
      authenticated: false,
      retryOnUnauthorized: false,
    });
  } finally {
    setAccessToken(null);
  }
}

const publicRequest = { authenticated: false, retryOnUnauthorized: false } as const;

export function requestPasswordReset(email: string) {
  return apiRequest<void>("/auth/forgot-password", {
    ...publicRequest,
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

/** Troca a senha pelo link do email; o servidor encerra todas as sessões da conta. */
export async function resetPassword(token: string, password: string) {
  await apiRequest<void>("/auth/reset-password", {
    ...publicRequest,
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
  setAccessToken(null);
}

export function previewInvite(token: string) {
  return apiRequest<InvitePreview>("/invites/preview", {
    ...publicRequest,
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export function acceptInvite(token: string, password: string) {
  return apiRequest<void>("/invites/accept", {
    ...publicRequest,
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
}
