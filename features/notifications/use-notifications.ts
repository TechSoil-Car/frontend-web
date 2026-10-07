"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/shared/api/api-client";
import {
  listNotifications,
  readAllNotifications,
  readNotification,
  type NotificationPage,
} from "./notifications-api";

export function useNotifications(
  plantationId: string | undefined,
  page = 1,
  filter: "all" | "unread" = "all",
) {
  const key = `${plantationId}:${page}:${filter}`;
  const [snapshot, setSnapshot] = useState<{
    key: string;
    data: NotificationPage;
  } | null>(null);
  const [failure, setFailure] = useState<{
    key: string;
    message: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const version = useRef(0);
  const saving = useRef(false);
  const data = snapshot?.key === key ? snapshot.data : null;
  const error = failure?.key === key ? failure.message : null;
  function setError(message: string | null) {
    setFailure(message ? { key, message } : null);
  }
  const reload = useCallback(async () => {
    if (!plantationId || saving.current) return;
    const request = ++version.current;
    try {
      const result = await listNotifications(plantationId, page, filter);
      if (request === version.current) {
        setSnapshot({ key, data: result });
        setFailure(null);
      }
    } catch (requestError) {
      if (request === version.current)
        setFailure({
          key,
          message:
            requestError instanceof ApiError
              ? requestError.message
              : "Não foi possível consultar as notificações.",
        });
    }
  }, [plantationId, page, filter, key]);

  useEffect(() => {
    const requestVersion = version;
    const first = window.setTimeout(() => void reload(), 0);
    const timer = window.setInterval(() => void reload(), 30_000);
    const update = () => void reload();
    window.addEventListener("techsoil:notifications-updated", update);
    return () => {
      requestVersion.current++;
      window.clearTimeout(first);
      window.clearInterval(timer);
      window.removeEventListener("techsoil:notifications-updated", update);
    };
  }, [reload]);

  async function markRead(id?: string) {
    if (!plantationId || !data || saving.current) return false;
    saving.current = true;
    setBusy(true);
    setError(null);
    version.current++;
    try {
      if (id) await readNotification(plantationId, id);
      else await readAllNotifications(plantationId, data.asOf);
      saving.current = false;
      window.dispatchEvent(new Event("techsoil:notifications-updated"));
      return true;
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "Não foi possível marcar como lida. Tente novamente.",
      );
      return false;
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }
  return { data, error, busy, reload, markRead };
}
