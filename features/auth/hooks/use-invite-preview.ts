"use client";

import { useCallback, useEffect, useState } from "react";
import { errorMessage } from "@/shared/api/error-message";
import { previewInvite } from "../services/auth-api";
import type { InvitePreview } from "../types/auth.types";

/** Dados do convite (nome, e-mail, plantação) a partir do token do link. */
export function useInvitePreview(token: string) {
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!token) return;
    let active = true;
    previewInvite(token)
      .then((data) => {
        if (active) {
          setPreview(data);
          setError(null);
        }
      })
      .catch((requestError: unknown) => {
        if (active)
          setError(errorMessage(requestError, "Não foi possível consultar o convite."));
      });
    return () => {
      active = false;
    };
  }, [token, attempt]);

  const retry = useCallback(() => {
    setError(null);
    setAttempt((value) => value + 1);
  }, []);

  return { preview, error, retry };
}
