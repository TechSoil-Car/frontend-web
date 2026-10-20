const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

/**
 * Site published without the backend (e.g. only the landing on Vercel): the panel is
 * shown in the live demo, so login is replaced by a notice and no API call is made.
 */
export const PANEL_OFFLINE = process.env.NEXT_PUBLIC_PANEL_OFFLINE === "true";

type ErrorPayload = {
  message?: string | string[];
  error?: string;
};

type AuthResponse = {
  access_token: string;
  user: SessionUser;
};

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  systemRole: "USER" | "SUPERADMIN";
};

/**
 * "expired": the server refused the session (sign in again).
 * "unavailable": rate limit, server error or network failure — the session
 * may still be valid, so it is kept and the user can retry.
 */
export type RefreshResult =
  | { status: "renewed"; user: SessionUser }
  | { status: "expired" }
  | { status: "unavailable" };

let accessToken: string | null = null;
// One refresh at a time for the whole app: the refresh cookie rotates, so two
// concurrent refreshes would make the second one present a revoked token.
let refreshPromise: Promise<RefreshResult> | null = null;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function setAccessToken(token: string | null) {
  accessToken = token;
}

async function parseError(response: Response) {
  const fallback = "Não foi possível concluir a solicitação.";

  try {
    const payload = (await response.json()) as ErrorPayload;
    if (Array.isArray(payload.message)) return payload.message.join(" ");
    return payload.message ?? payload.error ?? fallback;
  } catch {
    return fallback;
  }
}

export function refreshSession(): Promise<RefreshResult> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then(async (response): Promise<RefreshResult> => {
        if (response.ok) {
          const session = (await response.json()) as AuthResponse;
          setAccessToken(session.access_token);
          return { status: "renewed", user: session.user };
        }
        if (response.status === 429 || response.status >= 500)
          return { status: "unavailable" };
        setAccessToken(null);
        return { status: "expired" };
      })
      .catch((): RefreshResult => ({ status: "unavailable" }))
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

export type ApiRequestOptions = RequestInit & {
  authenticated?: boolean;
  retryOnUnauthorized?: boolean;
};

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const {
    authenticated = true,
    retryOnUnauthorized = true,
    headers: customHeaders,
    ...requestOptions
  } = options;
  const headers = new Headers(customHeaders);

  if (requestOptions.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (authenticated && accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...requestOptions,
    headers,
    credentials: "include",
  });

  if (response.status === 401 && authenticated && retryOnUnauthorized) {
    const refreshed = await refreshSession();
    if (refreshed.status === "renewed") {
      return apiRequest<T>(path, { ...options, retryOnUnauthorized: false });
    }
    if (refreshed.status === "unavailable") {
      // Not a sign-out: the screen shows the error and the user can retry.
      throw new ApiError(503, "Servidor indisponível no momento. Tente novamente em instantes.");
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("techsoil:session-expired"));
    }
  }

  if (!response.ok) {
    throw new ApiError(response.status, await parseError(response));
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
