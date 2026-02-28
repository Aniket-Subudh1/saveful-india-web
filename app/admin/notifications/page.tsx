"use client";

import { useAuth, useCurrentUser } from "@/hooks/useAuth";
import { useState, useEffect, useCallback } from "react";
import {
  notificationManagementService,
  NotificationStats,
  NotificationRecord,
  SendNotificationPayload,
} from "@/services/notificationManagementService";
import { authService } from "@/services/authService";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getAdminSidebarLinks } from "@/config/sidebar";
import { motion } from "motion/react";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faPaperPlane,
  faUsers,
  faUser,
  faMobileAlt,
  faAppleAlt,
  faRobot,
  faChartLine,
  faClock,
  faCheckCircle,
  faTimesCircle,
  faSpinner,
  faExclamationTriangle,
  faRedo,
  faBullhorn,
  faLink,
  faImage,
} from "@fortawesome/free-solid-svg-icons";

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: typeof faCheckCircle }> = {
  QUEUED: { bg: "bg-blue-100", text: "text-blue-700", icon: faClock },
  PROCESSING: { bg: "bg-yellow-100", text: "text-yellow-700", icon: faSpinner },
  SENT: { bg: "bg-green-100", text: "text-green-700", icon: faCheckCircle },
  PARTIALLY_SENT: { bg: "bg-orange-100", text: "text-orange-700", icon: faExclamationTriangle },
  FAILED: { bg: "bg-red-100", text: "text-red-700", icon: faTimesCircle },
};

const PRIORITY_STYLES: Record<string, string> = {
  low: "bg-gray-100 text-gray-600",
  normal: "bg-blue-100 text-blue-600",
  high: "bg-red-100 text-red-600",
};

export default function NotificationsPage() {
  const { isLoading } = useAuth("admin");
  const user = useCurrentUser("admin");
  const router = useRouter();

  // Stats
  const [stats, setStats] = useState<NotificationStats | null>(null);

  // Notification history
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("");

  // Send form
  const [formTitle, setFormTitle] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formDeepLink, setFormDeepLink] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formPriority, setFormPriority] = useState<"low" | "normal" | "high">("normal");
  const [formTargetType, setFormTargetType] = useState<"broadcast" | "targeted">("broadcast");
  const [formTargetUserIds, setFormTargetUserIds] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);

  // Character counts
  const titleMaxLen = 200;
  const bodyMaxLen = 4096;

  const loadStats = useCallback(async () => {
    try {
      const data = await notificationManagementService.getStats();
      setStats(data);
    } catch (err: any) {
      console.error("Failed to load stats:", err);
    }
  }, []);

  const loadNotifications = useCallback(async (page: number, status?: string) => {
    setHistoryLoading(true);
    try {
      const data = await notificationManagementService.getNotifications(page, 10, status || undefined);
      setNotifications(data.notifications);
      setHistoryTotalPages(data.totalPages);
    } catch (err: any) {
      console.error("Failed to load notifications:", err);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && user) {
      loadStats();
      loadNotifications(1);
    }
  }, [isLoading, user, loadStats, loadNotifications]);

  useEffect(() => {
    if (!isLoading && user) {
      loadNotifications(historyPage, filterStatus);
    }
  }, [historyPage, filterStatus, isLoading, user, loadNotifications]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formBody.trim()) return;

    setIsSending(true);
    setSendResult(null);

    try {
      const payload: SendNotificationPayload = {
        title: formTitle.trim(),
        body: formBody.trim(),
        priority: formPriority,
      };

      if (formDeepLink.trim()) payload.deepLink = formDeepLink.trim();
      if (formImageUrl.trim()) payload.imageUrl = formImageUrl.trim();

      if (formTargetType === "broadcast") {
        payload.isBroadcast = true;
      } else {
        const ids = formTargetUserIds
          .split(/[,\n]+/)
          .map((id) => id.trim())
          .filter(Boolean);
        if (ids.length === 0) {
          setSendResult({ success: false, message: "Please enter at least one user ID" });
          setIsSending(false);
          return;
        }
        payload.targetUserIds = ids;
      }

      await notificationManagementService.sendNotification(payload);
      setSendResult({ success: true, message: "Notification queued successfully!" });

      // Reset form
      setFormTitle("");
      setFormBody("");
      setFormDeepLink("");
      setFormImageUrl("");
      setFormPriority("normal");
      setFormTargetType("broadcast");
      setFormTargetUserIds("");

      // Refresh data
      await Promise.all([loadStats(), loadNotifications(1, filterStatus)]);
      setHistoryPage(1);
    } catch (err: any) {
      setSendResult({ success: false, message: err.message || "Failed to send notification" });
    } finally {
      setIsSending(false);
    }
  };

  const handleLogout = async () => {
    await authService.logout("admin");
    router.push("/admin/login");
  };

  const sidebarConfig = {
    role: "admin" as const,
    userName: user?.name || "Admin",
    userEmail: user?.email || "",
    links: getAdminSidebarLinks(handleLogout),
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-lg font-saveful text-saveful-green">Loading...</div>
      </div>
    );
  }

  return (
    <DashboardLayout config={sidebarConfig}>
      <div className="relative h-full overflow-y-auto bg-gradient-to-br from-gray-50 via-saveful-cream/20 to-gray-50 p-4 md:p-8">
        {/* Decorative Background */}
        <div className="pointer-events-none absolute right-0 top-0 opacity-5">
          <Image src="/Illustration@2x.png" alt="" width={500} height={500} className="object-contain" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-4 shadow-xl">
                <FontAwesomeIcon icon={faBell} className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="mb-1 font-saveful-bold text-4xl text-saveful-green">Push Notifications</h1>
                <p className="font-saveful text-saveful-gray">Send and monitor push notifications</p>
              </div>
            </div>
          </motion.div>

          {/* Stats Cards */}
          {stats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
            >
              <div className="rounded-2xl bg-white p-5 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-blue-100 p-3">
                    <FontAwesomeIcon icon={faMobileAlt} className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-saveful text-gray-500">Active Devices</p>
                    <p className="text-xl font-saveful-bold text-gray-900">{stats.activeTokens.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-gray-100 p-3">
                    <FontAwesomeIcon icon={faAppleAlt} className="h-5 w-5 text-gray-700" />
                  </div>
                  <div>
                    <p className="text-xs font-saveful text-gray-500">iOS / Android</p>
                    <p className="text-xl font-saveful-bold text-gray-900">
                      {stats.iosSplit} / {stats.androidSplit}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-yellow-100 p-3">
                    <FontAwesomeIcon icon={faClock} className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-xs font-saveful text-gray-500">Queued</p>
                    <p className="text-xl font-saveful-bold text-gray-900">{stats.queued}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-green-100 p-3">
                    <FontAwesomeIcon icon={faCheckCircle} className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-saveful text-gray-500">Sent Today</p>
                    <p className="text-xl font-saveful-bold text-gray-900">{stats.sentToday}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
            {/* ─── Send Form (left 3 cols) ─── */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-3"
            >
              <div className="rounded-2xl bg-white p-6 shadow-lg">
                <div className="mb-6 flex items-center gap-3">
                  <div className="rounded-xl bg-gradient-to-br from-saveful-green to-green-600 p-3">
                    <FontAwesomeIcon icon={faPaperPlane} className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="font-saveful-bold text-xl text-gray-900">Send Notification</h2>
                </div>

                <form onSubmit={handleSend} className="space-y-5">
                  {/* Title */}
                  <div>
                    <label className="mb-1.5 block text-sm font-saveful text-gray-700">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      maxLength={titleMaxLen}
                      placeholder="Notification title"
                      className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-2.5 text-sm transition-colors focus:border-saveful-green focus:bg-white focus:outline-none"
                      required
                    />
                    <p className="mt-1 text-xs text-gray-400">{formTitle.length}/{titleMaxLen}</p>
                  </div>

                  {/* Body */}
                  <div>
                    <label className="mb-1.5 block text-sm font-saveful text-gray-700">
                      Body <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formBody}
                      onChange={(e) => setFormBody(e.target.value)}
                      maxLength={bodyMaxLen}
                      placeholder="Notification message..."
                      rows={4}
                      className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-2.5 text-sm transition-colors focus:border-saveful-green focus:bg-white focus:outline-none resize-none"
                      required
                    />
                    <p className="mt-1 text-xs text-gray-400">{formBody.length}/{bodyMaxLen}</p>
                  </div>

                  {/* Priority + Target Type row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-saveful text-gray-700">Priority</label>
                      <select
                        value={formPriority}
                        onChange={(e) => setFormPriority(e.target.value as any)}
                        className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-2.5 text-sm transition-colors focus:border-saveful-green focus:bg-white focus:outline-none"
                      >
                        <option value="low">Low</option>
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-saveful text-gray-700">Target</label>
                      <select
                        value={formTargetType}
                        onChange={(e) => setFormTargetType(e.target.value as any)}
                        className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-2.5 text-sm transition-colors focus:border-saveful-green focus:bg-white focus:outline-none"
                      >
                        <option value="broadcast">All Users (Broadcast)</option>
                        <option value="targeted">Specific Users</option>
                      </select>
                    </div>
                  </div>

                  {/* Target User IDs (conditional) */}
                  {formTargetType === "targeted" && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                      <label className="mb-1.5 block text-sm font-saveful text-gray-700">
                        <FontAwesomeIcon icon={faUser} className="mr-1.5 h-3 w-3" />
                        User IDs <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={formTargetUserIds}
                        onChange={(e) => setFormTargetUserIds(e.target.value)}
                        placeholder="Enter user IDs separated by commas or newlines..."
                        rows={3}
                        className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-2.5 text-sm transition-colors focus:border-saveful-green focus:bg-white focus:outline-none resize-none font-mono"
                      />
                    </motion.div>
                  )}

                  {/* Deep Link */}
                  <div>
                    <label className="mb-1.5 block text-sm font-saveful text-gray-700">
                      <FontAwesomeIcon icon={faLink} className="mr-1.5 h-3 w-3" />
                      Deep Link <span className="text-gray-400">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={formDeepLink}
                      onChange={(e) => setFormDeepLink(e.target.value)}
                      placeholder="/inventory, /track, /make/prep/123..."
                      className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-2.5 text-sm transition-colors focus:border-saveful-green focus:bg-white focus:outline-none"
                    />
                  </div>

                  {/* Image URL */}
                  <div>
                    <label className="mb-1.5 block text-sm font-saveful text-gray-700">
                      <FontAwesomeIcon icon={faImage} className="mr-1.5 h-3 w-3" />
                      Image URL <span className="text-gray-400">(optional)</span>
                    </label>
                    <input
                      type="url"
                      value={formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-2.5 text-sm transition-colors focus:border-saveful-green focus:bg-white focus:outline-none"
                    />
                  </div>

                  {/* Result message */}
                  {sendResult && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`rounded-xl p-3 text-sm font-saveful ${
                        sendResult.success
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                      }`}
                    >
                      <FontAwesomeIcon
                        icon={sendResult.success ? faCheckCircle : faTimesCircle}
                        className="mr-2"
                      />
                      {sendResult.message}
                    </motion.div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isSending || !formTitle.trim() || !formBody.trim()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-saveful-green to-green-600 px-6 py-3 font-saveful-bold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSending ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} className="h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faPaperPlane} className="h-4 w-4" />
                        Send Notification
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>

            {/* ─── History (right 2 cols) ─── */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-2"
            >
              <div className="rounded-2xl bg-white p-6 shadow-lg">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 p-3">
                      <FontAwesomeIcon icon={faChartLine} className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="font-saveful-bold text-xl text-gray-900">History</h2>
                  </div>
                  <button
                    onClick={() => {
                      loadStats();
                      loadNotifications(historyPage, filterStatus);
                    }}
                    className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                    title="Refresh"
                  >
                    <FontAwesomeIcon icon={faRedo} className="h-4 w-4" />
                  </button>
                </div>

                {/* Status filter */}
                <div className="mb-4 flex flex-wrap gap-1.5">
                  {["", "QUEUED", "PROCESSING", "SENT", "PARTIALLY_SENT", "FAILED"].map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setFilterStatus(s);
                        setHistoryPage(1);
                      }}
                      className={`rounded-lg px-3 py-1 text-xs font-saveful transition-all ${
                        filterStatus === s
                          ? "bg-saveful-green text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {s || "All"}
                    </button>
                  ))}
                </div>

                {/* Notification list */}
                {historyLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <FontAwesomeIcon icon={faSpinner} className="h-6 w-6 animate-spin text-saveful-green" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="py-12 text-center">
                    <FontAwesomeIcon icon={faBell} className="mb-3 h-10 w-10 text-gray-200" />
                    <p className="text-sm font-saveful text-gray-400">No notifications yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((n) => {
                      const statusStyle = STATUS_STYLES[n.status] || STATUS_STYLES.QUEUED;
                      return (
                        <div
                          key={n._id}
                          className="rounded-xl border border-gray-100 p-3 transition-colors hover:bg-gray-50"
                        >
                          <div className="mb-1.5 flex items-start justify-between gap-2">
                            <h4 className="text-sm font-saveful-bold text-gray-900 line-clamp-1">
                              {n.title}
                            </h4>
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-saveful ${statusStyle.bg} ${statusStyle.text} whitespace-nowrap`}
                            >
                              <FontAwesomeIcon icon={statusStyle.icon} className="h-2.5 w-2.5" />
                              {n.status}
                            </span>
                          </div>
                          <p className="mb-2 text-xs text-gray-500 line-clamp-2">{n.body}</p>
                          <div className="flex items-center gap-2 text-[10px] text-gray-400">
                            <span className={`rounded px-1.5 py-0.5 ${PRIORITY_STYLES[n.priority]}`}>
                              {n.priority}
                            </span>
                            {n.isBroadcast ? (
                              <span className="flex items-center gap-0.5">
                                <FontAwesomeIcon icon={faBullhorn} className="h-2.5 w-2.5" />
                                broadcast
                              </span>
                            ) : (
                              <span className="flex items-center gap-0.5">
                                <FontAwesomeIcon icon={faUsers} className="h-2.5 w-2.5" />
                                {n.targetUserIds?.length || 0} users
                              </span>
                            )}
                            <span>
                              {new Date(n.createdAt).toLocaleDateString("en-AU", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {n.retryCount > 0 && (
                              <span className="text-orange-500">retry: {n.retryCount}/{n.maxRetries}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Pagination */}
                {historyTotalPages > 1 && (
                  <div className="mt-4 flex items-center justify-between">
                    <button
                      onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                      disabled={historyPage <= 1}
                      className="rounded-lg px-3 py-1.5 text-xs font-saveful text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                    >
                      Previous
                    </button>
                    <span className="text-xs text-gray-400">
                      Page {historyPage} of {historyTotalPages}
                    </span>
                    <button
                      onClick={() => setHistoryPage((p) => Math.min(historyTotalPages, p + 1))}
                      disabled={historyPage >= historyTotalPages}
                      className="rounded-lg px-3 py-1.5 text-xs font-saveful text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
