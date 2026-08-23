"use client";

import { AuthProvider } from "@/features/auth/context/AuthContext";
import { PlantationProvider } from "@/features/plantations/context/PlantationContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider><PlantationProvider>{children}</PlantationProvider></AuthProvider>;
}
