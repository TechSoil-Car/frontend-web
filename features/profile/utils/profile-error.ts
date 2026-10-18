import { errorMessage } from "@/shared/api/error-message";

/** Mensagem das ações do perfil; 429 tem texto próprio. */
export const profileError = (error: unknown) =>
  errorMessage(
    error,
    "Não foi possível concluir. Verifique sua conexão e tente novamente.",
    {
      byStatus: {
        429: "Muitas tentativas. Aguarde um minuto e tente novamente.",
      },
    },
  );
