import { ForgotPasswordScreen } from "@/features/auth/components/password-recovery/ForgotPasswordScreen";

export const metadata = {
  title: "Recuperar senha | TechSoil",
  robots: { index: false, follow: false },
};
export default function ForgotPasswordPage() {
  return <ForgotPasswordScreen />;
}
