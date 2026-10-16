"use client";

import { AuthProvider } from "@/features/auth/context/AuthContext";
import { PlantationProvider } from "@/features/plantations/context/PlantationContext";
import { OrganizationProvider } from "@/features/organizations/OrganizationContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider><OrganizationProvider><PlantationProvider>{children}</PlantationProvider></OrganizationProvider></AuthProvider>;
}
