import { NotificationsScreen } from "@/features/notifications";

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ plantation?: string | string[] }>;
}) {
  const { plantation } = await searchParams;
  return (
    <NotificationsScreen
      initialPlantationId={
        typeof plantation === "string" ? plantation : undefined
      }
    />
  );
}
