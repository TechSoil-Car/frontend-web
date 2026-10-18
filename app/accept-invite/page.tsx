import { AcceptInviteScreen } from "@/features/auth";

export const metadata = {
  title: "Aceitar convite | TechSoil",
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
