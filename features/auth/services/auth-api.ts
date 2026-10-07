import { apiRequest, setAccessToken } from "@/shared/api/api-client";
import type {
  AuthResponse,
  AuthUser,
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

let sessionRefreshPromise: Promise<AuthResponse> | null = null;

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

export function refreshSession() {
  if (!sessionRefreshPromise) {
    sessionRefreshPromise = apiRequest<AuthResponse>("/auth/refresh", {
      method: "POST",
      authenticated: false,
      retryOnUnauthorized: false,
    })
      .then((session) => {
        setAccessToken(session.access_token);
        return session;
      })
      .finally(() => {
        sessionRefreshPromise = null;
      });
  }

  return sessionRefreshPromise;
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
