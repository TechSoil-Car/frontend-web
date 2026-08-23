const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type ErrorPayload = {
  message?: string | string[];
  error?: string;
};

type AuthResponse = {
  access_token: string;
};

let accessToken: string | null = null;
let refreshPromise: Promise<boolean> | null = null;

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

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then(async (response) => {
        if (!response.ok) return false;
        const session = (await response.json()) as AuthResponse;
        setAccessToken(session.access_token);
        return true;
      })
      .catch(() => false)
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
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiRequest<T>(path, { ...options, retryOnUnauthorized: false });
    }

    setAccessToken(null);
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
