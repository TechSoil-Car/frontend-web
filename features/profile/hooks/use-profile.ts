"use client";

import { useCallback, useEffect, useState } from "react";
import { getProfile, type UserProfile } from "@/features/auth/services/auth-api";
import { profileError } from "../utils/profile-error";

/** Perfil da conta conectada, com nova tentativa após falha. */
export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    getProfile()
      .then((value) => {
        if (active) {
          setProfile(value);
          setError(null);
        }
      })
      .catch((requestError: unknown) => {
        if (active) setError(profileError(requestError));
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  return { profile, error, retry };
}
