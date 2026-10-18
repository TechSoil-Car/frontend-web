"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { errorMessage } from "@/shared/api/error-message";
import { getAdminData } from "../services/admin-api";
import type { AdminData, AdminPages } from "../types/admin.types";

export const ADMIN_ERROR = "Não foi possível acessar o serviço. Tente novamente.";

/** Dados do painel do superadmin; só a resposta mais recente é aplicada. */
export function useAdminData(enabled: boolean) {
  const [data, setData] = useState<AdminData | null>(null);
  const [pages, setPages] = useState<AdminPages>({
    users: 1,
    plantations: 1,
    invites: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const version = useRef(0);

  const reload = useCallback(async () => {
    if (!enabled) return;
    const request = ++version.current;
    setLoading(true);
    setError(null);
    try {
      const result = await getAdminData(pages);
      if (request === version.current) setData(result);
    } catch (requestError) {
      if (request === version.current) {
        setError(errorMessage(requestError, ADMIN_ERROR));
        setData(null);
      }
    } finally {
      if (request === version.current) setLoading(false);
    }
  }, [enabled, pages]);

  useEffect(() => {
    const timer = window.setTimeout(() => void reload(), 0);
    return () => {
      window.clearTimeout(timer);
      version.current += 1;
    };
  }, [reload]);

  return { data, pages, setPages, loading, error, reload };
}
