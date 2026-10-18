"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { listOrganizations } from "../services/organizations-api";
import type { OrganizationMembership } from "../types/organization.types";

type OrganizationContextValue = {
  memberships: OrganizationMembership[];
  selected: OrganizationMembership | null;
  status: "loading" | "ready" | "error";
  error: string | null;
  selectOrganization: (id: string) => void;
  reloadOrganizations: (preferredId?: string) => Promise<void>;
};
const Context = createContext<OrganizationContextValue | null>(null);

export function OrganizationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, status } = useAuth();
  // Remount the complete operational subtree on account changes; no previous tenant data survives logout.
  return (
    <OrganizationSession
      key={user?.id ?? "anonymous"}
      enabled={status === "authenticated" && user?.systemRole !== "SUPERADMIN"}
      storageKey={`techsoil:organization:${user?.id ?? "anonymous"}`}
    >
      {children}
    </OrganizationSession>
  );
}

function OrganizationSession({
  children,
  enabled,
  storageKey,
}: {
  children: React.ReactNode;
  enabled: boolean;
  storageKey: string;
}) {
  const [memberships, setMemberships] = useState<OrganizationMembership[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] =
    useState<OrganizationContextValue["status"]>("loading");
  const [error, setError] = useState<string | null>(null);
  const generation = useRef(0);
  const invalidateRequests = useCallback(() => {
    generation.current++;
  }, []);
  const reloadOrganizations = useCallback(
    async (preferredId?: string) => {
      const request = ++generation.current;
      setStatus("loading");
      try {
        const items = enabled
          ? await listOrganizations()
          : [];
        if (request !== generation.current) return;
        setMemberships(items);
        setSelectedId((current) => {
          const stored = window.localStorage.getItem(storageKey);
          const next =
            [preferredId, current, stored].find((id) =>
              items.some((item) => item.organization.id === id),
            ) ??
            items[0]?.organization.id ??
            null;
          if (next) window.localStorage.setItem(storageKey, next);
          else window.localStorage.removeItem(storageKey);
          return next;
        });
        setError(null);
        setStatus("ready");
      } catch {
        if (request !== generation.current) return;
        setMemberships([]);
        setSelectedId(null);
        setError("Não foi possível carregar as organizações. Tente novamente.");
        setStatus("error");
      }
    },
    [enabled, storageKey],
  );
  useEffect(() => {
    const timer = window.setTimeout(() => void reloadOrganizations(), 0);
    const refresh = () => {
      if (document.visibilityState === "visible") void reloadOrganizations();
    };
    window.addEventListener("focus", refresh);
    return () => {
      invalidateRequests();
      window.clearTimeout(timer);
      window.removeEventListener("focus", refresh);
    };
  }, [reloadOrganizations, invalidateRequests]);
  const selectOrganization = (id: string) => {
    if (!memberships.some((item) => item.organization.id === id)) return;
    window.localStorage.setItem(storageKey, id);
    setSelectedId(id);
  };
  const selected =
    memberships.find((item) => item.organization.id === selectedId) ?? null;
  return (
    <Context.Provider
      value={{
        memberships,
        selected,
        status,
        error,
        selectOrganization,
        reloadOrganizations,
      }}
    >
      {children}
    </Context.Provider>
  );
}

export function useOrganizations() {
  const context = useContext(Context);
  if (!context) throw new Error("OrganizationProvider obrigatório");
  return context;
}
