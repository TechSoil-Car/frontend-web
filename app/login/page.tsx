import type { Metadata } from "next";
import { LoginScreen } from "@/features/auth";

export const metadata: Metadata = {
  title: "Acesso | TechSoil Systems",
  description: "Acesse o painel TechSoil e acompanhe sua operação agrícola com mais precisão.",
};

export default function LoginPage() {
  return <LoginScreen />;
}
