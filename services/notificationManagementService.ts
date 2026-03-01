import { apiGet, apiPost } from "@/lib/apiClient";

// ---------- Types ----------

export interface NotificationStats {
  totalTokens: number;
  activeTokens: number;
  iosTokens: number;
  androidTokens: number;
  queuedNotifications: number;
  sentToday: number;
  queue: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  };
}

export interface NotificationRecord {
  _id: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  deepLink?: string;
  imageUrl?: string;
  priority: "low" | "normal" | "high";
  status: "QUEUED" | "PROCESSING" | "SENT" | "PARTIALLY_SENT" | "FAILED";
  isBroadcast: boolean;
  targetUserIds?: string[];
  retryCount: number;
  maxRetries: number;
  successCount?: number;
  failureCount?: number;
  scheduledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationListResponse {
  notifications: NotificationRecord[];
  total: number;
  page: number;
  pages: number;
}

export interface SendNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  deepLink?: string;
  imageUrl?: string;
  priority?: "low" | "normal" | "high";
  targetUserIds?: string[];
  isBroadcast?: boolean;
  scheduledAt?: string;
}

// ---------- API base ----------

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

// ---------- Service ----------

class NotificationManagementService {
  async getStats(): Promise<NotificationStats> {
    const res = await apiGet(`${API_BASE}/api/notifications/stats`, "admin");
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "Failed to load stats" }));
      throw new Error(err.message || "Failed to load stats");
    }
    return res.json();
  }

  async getNotifications(
    page = 1,
    limit = 20,
    status?: string,
  ): Promise<NotificationListResponse> {
    let url = `${API_BASE}/api/notifications?page=${page}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    const res = await apiGet(url, "admin");
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "Failed to load notifications" }));
      throw new Error(err.message || "Failed to load notifications");
    }
    return res.json();
  }

  async getNotification(id: string): Promise<NotificationRecord> {
    const res = await apiGet(`${API_BASE}/api/notifications/${id}`, "admin");
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "Failed to load notification" }));
      throw new Error(err.message || "Failed to load notification");
    }
    return res.json();
  }

  async sendNotification(payload: SendNotificationPayload): Promise<NotificationRecord> {
    const res = await apiPost(`${API_BASE}/api/notifications/send`, payload, "admin");
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "Failed to send notification" }));
      throw new Error(err.message || "Failed to send notification");
    }
    return res.json();
  }
}

export const notificationManagementService = new NotificationManagementService();
