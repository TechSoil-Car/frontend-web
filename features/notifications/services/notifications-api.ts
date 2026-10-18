import { apiRequest } from "@/shared/api/api-client";
import type { NotificationPage } from "../types/notification.types";

const base = (id: string) =>
  `/plantations/${encodeURIComponent(id)}/notifications`;
export const listNotifications = (
  id: string,
  page = 1,
  filter: "all" | "unread" = "all",
) =>
  apiRequest<NotificationPage>(
    `${base(id)}?${new URLSearchParams({ page: String(page), filter })}`,
  );
export const readNotification = (id: string, notificationId: string) =>
  apiRequest(`${base(id)}/${encodeURIComponent(notificationId)}/read`, {
    method: "PATCH",
  });
export const readAllNotifications = (id: string, before: string) =>
  apiRequest(`${base(id)}/read-all`, {
    method: "PATCH",
    body: JSON.stringify({ before }),
  });
export const getNotificationPreferences = () =>
  apiRequest<{ alertEmailsEnabled: boolean }>("/notifications/preferences");
export const updateNotificationPreferences = (alertEmailsEnabled: boolean) =>
  apiRequest<{ alertEmailsEnabled: boolean }>("/notifications/preferences", {
    method: "PATCH",
    body: JSON.stringify({ alertEmailsEnabled }),
  });
