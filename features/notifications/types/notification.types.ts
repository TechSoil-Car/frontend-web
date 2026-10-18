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
