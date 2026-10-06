import { ResetPasswordScreen } from "@/features/auth/components/password-recovery/ResetPasswordScreen";

export const metadata = {
  title: "Redefinir senha | TechSoil",
  robots: { index: false, follow: false },
  referrer: "no-referrer" as const,
};
export default function ResetPasswordPage() {
  return <ResetPasswordScreen />;
}
