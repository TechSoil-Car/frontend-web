import { apiRequest } from "@/shared/api/api-client";

export type NotificationItem = {
  id: string;
  createdAt: string;
  readAt: string | null;
  emailStatus: string;
  emailSentAt: string | null;
  event: {
    id: string;
    deviceId: string;
    deviceName: string;
    kind: string;
    severity: string;
    title: string;
    message: string;
    detectedAt: string;
    readingAt: string | null;
    resolvedAt: string | null;
  };
};
export type NotificationPage = {
  data: NotificationItem[];
  total: number;
  unread: number;
  page: number;
  pageSize: number;
  asOf: string;
};
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
