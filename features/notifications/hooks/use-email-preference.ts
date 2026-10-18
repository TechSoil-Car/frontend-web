"use client";

import { useEffect, useState } from "react";
import { errorMessage } from "@/shared/api/error-message";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from "../services/notifications-api";

/** Preferência de alertas por e-mail da conta; null enquanto carrega. */
export function useEmailPreference() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    getNotificationPreferences()
      .then((result) => {
        if (active) {
          setEnabled(result.alertEmailsEnabled);
          setError(null);
        }
      })
      .catch(() => {
        if (active)
          setError("Não foi possível consultar sua preferência de e-mails.");
      });
    return () => {
      active = false;
    };
  }, [attempt]);
  async function toggle() {
    if (busy || enabled === null) return;
    setBusy(true);
    setError(null);
    try {
      setEnabled(
        (await updateNotificationPreferences(!enabled)).alertEmailsEnabled,
      );
    } catch (requestError) {
      setError(
        errorMessage(requestError, "Não foi possível salvar sua preferência."),
      );
    } finally {
      setBusy(false);
    }
  }
  const retry = () => setAttempt((value) => value + 1);
  return { enabled, busy, error, retry, toggle };
}
