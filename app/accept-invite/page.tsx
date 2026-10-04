import { AcceptInviteScreen } from "@/features/auth/components/accept-invite-screen/AcceptInviteScreen";

export const metadata = {
  title: "Ativar conta | TechSoil",
  robots: { index: false, follow: false },
  referrer: "no-referrer" as const,
};

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const { token } = await searchParams;
  return <AcceptInviteScreen token={typeof token === "string" ? token : ""} />;
}
