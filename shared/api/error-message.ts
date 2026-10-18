import { ApiError } from "./api-client";

type ErrorMessageOptions = {
  /** Texto próprio para alguns status (ex.: 401 no login, 429 no limite de tentativas). */
  byStatus?: Partial<Record<number, string>>;
  /** false: erro do servidor sem texto próprio usa o texto padrão em vez da mensagem do backend. */
  serverMessage?: boolean;
};

/**
 * Mensagem para o usuário a partir de um erro de requisição: a do backend quando houver;
 * o texto padrão da tela para falha de rede ou erro inesperado.
 */
export function errorMessage(
  error: unknown,
  fallback: string,
  { byStatus, serverMessage = true }: ErrorMessageOptions = {},
) {
  if (!(error instanceof ApiError)) return fallback;
  return byStatus?.[error.status] ?? (serverMessage ? error.message : fallback);
}
