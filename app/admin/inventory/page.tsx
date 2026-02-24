"use client";
import { useAuth, useCurrentUser } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import {
  inventoryManagementService,
  AdminUser,
  AdminUsersResponse,
  WasteAnalytics,
  InventoryGroupedResponse,
  StorageLocation,
  WasteType,
  DiscardReason,
} from "@/services/inventoryManagementService";
import { authService } from "@/services/authService";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getAdminSidebarLinks } from "@/config/sidebar";
import { motion, AnimatePresence } from "motion/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBoxOpen,
  faUsers,
  faTrash,
  faChartBar,
  faSearch,
  faExclamationCircle,
  faChevronDown,
  faChevronUp,
  faUser,
  faGlobe,
  faFilter,
  faLeaf,
  faSnowflake,
  faArchive,
  faWarehouse,
  faBoxes,
  faRefresh,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { COUNTRIES } from "@/lib/countries";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

/* ─────────────────────── constants ─────────────────────── */
const PIE_COLORS = ["#2D5F4F", "#A68FD9", "#F7931E", "#E91E63", "#2196F3"];

const STORAGE_META: Record<string, { label: string; icon: typeof faBoxes; color: string }> = {
  [StorageLocation.FRIDGE]: { label: "Fridge", icon: faBoxes, color: "bg-blue-100 text-blue-700" },
  [StorageLocation.FREEZER]: { label: "Freezer", icon: faSnowflake, color: "bg-cyan-100 text-cyan-700" },
  [StorageLocation.PANTRY]: { label: "Pantry", icon: faArchive, color: "bg-amber-100 text-amber-700" },
  [StorageLocation.OTHER]: { label: "Other", icon: faWarehouse, color: "bg-gray-100 text-gray-700" },
};

const FRESHNESS_COLORS: Record<string, string> = {
  fresh: "bg-green-100 text-green-700",
  expiring_soon: "bg-yellow-100 text-yellow-700",
  expired: "bg-red-100 text-red-700",
};

/* ─────────────────────── sub components ─────────────────────── */
function StatCard({
  title,
  value,
  icon,
  color,
  sub,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: "green" | "purple" | "orange" | "pink";
  sub?: string;
}) {
  const colorMap = {
    green: "from-saveful-green/10 to-saveful-green/5 text-saveful-green",
    purple: "from-saveful-purple/10 to-saveful-purple/5 text-saveful-purple",
    orange: "from-saveful-orange/10 to-saveful-orange/5 text-saveful-orange",
    pink: "from-saveful-pink/10 to-saveful-pink/5 text-saveful-pink",
  };
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02, y: -4 }}
      className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg transition-all hover:shadow-2xl"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className={`rounded-xl bg-gradient-to-br p-3 shadow-md ${colorMap[color]}`}>{icon}</div>
      </div>
      <h3 className="mb-1 font-saveful text-sm text-gray-500">{title}</h3>
      <p className="font-saveful-bold text-3xl text-saveful-black">{value}</p>
      {sub && <p className="mt-1 font-saveful text-xs text-gray-400">{sub}</p>}
    </motion.div>
  );
}

function DietaryBadge({ label, active }: { label: string; active?: boolean }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-saveful ${
        active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400 line-through"
      }`}
    >
      {label}
    </span>
  );
}

function BadgeChip({ label, color }: { label: string; color: string }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-saveful ${color}`}>{label}</span>
  );
}

function Detail({ label, val }: { label: string; val?: string | number | null }) {
  if (!val && val !== 0) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-saveful text-xs text-gray-400">{label}</span>
      <span className="font-saveful text-sm text-saveful-black">{val}</span>
    </div>
  );
}

function DietRow({ label, val }: { label: string; val?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="font-saveful text-gray-500">{label}</span>
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-saveful ${
          val ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"
        }`}
      >
        {val ? "Yes" : "No"}
      </span>
    </div>
  );
}

/* ─────────────────────── main page ─────────────────────── */
export default function InventoryPage() {
  const { isLoading } = useAuth("admin");
  const user = useCurrentUser("admin");
  const router = useRouter();

  /* overview & analytics state */
  const [pageLoading, setPageLoading] = useState(true);
  const [overview, setOverview] = useState<{
    totalUsers: number;
    totalItems: number;
    totalDiscarded: number;
    avgItemsPerUser: number;
    topWastedIngredients: { name: string; count: number }[];
    wasteByType: { type: WasteType; count: number }[];
  } | null>(null);
  const [globalAnalytics, setGlobalAnalytics] = useState<WasteAnalytics | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  /* user search state */
  const [nameQuery, setNameQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [usersResult, setUsersResult] = useState<AdminUsersResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);

  /* expanded user detail state */
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [userInventoryMap, setUserInventoryMap] = useState<Record<string, InventoryGroupedResponse>>({});
  const [userAnalyticsMap, setUserAnalyticsMap] = useState<Record<string, WasteAnalytics>>({});
  const [userDetailLoading, setUserDetailLoading] = useState<Record<string, boolean>>({});

  /* ── load overview & analytics on mount ── */
  const loadOverview = useCallback(async () => {
    try {
      setPageLoading(true);
      setPageError(null);
      const [ov, ga] = await Promise.all([
        inventoryManagementService.getInventoryOverview(),
        inventoryManagementService.getGlobalWasteAnalytics(),
      ]);
      setOverview(ov);
      setGlobalAnalytics(ga);
    } catch (e: any) {
      setPageError(e?.message || "Failed to load inventory overview");
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && user) loadOverview();
  }, [isLoading, user, loadOverview]);

  /* ── search users ── */
  const handleSearch = async (page = 1) => {
    try {
      setSearchLoading(true);
      setHasSearched(true);
      const res = await inventoryManagementService.searchAdminUsers({
        name: nameQuery.trim() || undefined,
        country: countryFilter || undefined,
        page,
        limit: 10,
      });
      setUsersResult(res);
      setCurrentPage(page);
    } catch (e: any) {
      console.error(e);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleClear = () => {
    setNameQuery("");
    setCountryFilter("");
    setUsersResult(null);
    setHasSearched(false);
    setExpandedUserId(null);
    setCurrentPage(1);
  };

  /* ── expand user card ── */
  const handleToggleUser = async (userId: string) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null);
      return;
    }
    setExpandedUserId(userId);
    if (!userInventoryMap[userId]) {
      setUserDetailLoading((p) => ({ ...p, [userId]: true }));
      try {
        const [inv, analytics] = await Promise.all([
          inventoryManagementService.getInventoryGroupedByUser(userId),
          inventoryManagementService.getWasteAnalyticsByUser(userId),
        ]);
        setUserInventoryMap((p) => ({ ...p, [userId]: inv }));
        setUserAnalyticsMap((p) => ({ ...p, [userId]: analytics }));
      } catch (e) {
        console.error("Failed to load user detail", e);
      } finally {
        setUserDetailLoading((p) => ({ ...p, [userId]: false }));
      }
    }
  };

  /* ── sidebar & logout ── */
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
        <div className="text-lg font-saveful text-saveful-green">Loading…</div>
      </div>
    );
  }

  /* ─────────────────────── render ─────────────────────── */
  return (
    <DashboardLayout config={sidebarConfig}>
      <div className="relative h-full overflow-y-auto bg-gradient-to-br from-gray-50 via-saveful-cream/20 to-gray-50 p-4 md:p-8">
        <div className="relative z-10 mx-auto max-w-7xl">

          {/* ── Header ── */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-gradient-to-br from-saveful-green to-saveful-green/70 p-4 shadow-xl">
                  <FontAwesomeIcon icon={faBoxOpen} className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h1 className="mb-1 font-saveful-bold text-4xl text-saveful-green">
                    Inventory Management
                  </h1>
                  <p className="font-saveful text-saveful-gray">
                    Global overview, waste analytics and per-user inventory explorer
                  </p>
                </div>
              </div>
              <button
                onClick={loadOverview}
                className="rounded-lg bg-white px-4 py-2 text-sm font-saveful text-saveful-green shadow-md hover:shadow-lg transition-all flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faRefresh} className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </motion.div>

          {/* ── Error Banner ── */}
          {pageError && (
            <div className="mb-6 flex items-center gap-3 rounded-2xl bg-red-50 p-4 shadow text-red-700">
              <FontAwesomeIcon icon={faExclamationCircle} className="h-5 w-5 flex-shrink-0" />
              <span className="font-saveful text-sm">{pageError}</span>
              <button onClick={loadOverview} className="ml-auto text-sm underline font-saveful">Retry</button>
            </div>
          )}

          {/* ── Loading skeleton for stats ── */}
          {pageLoading ? (
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-36 animate-pulse rounded-2xl bg-gray-200" />
              ))}
            </div>
          ) : overview && (
            <>
              {/* ── Stat Cards ── */}
              <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  title="Total Users"
                  value={overview.totalUsers}
                  icon={<FontAwesomeIcon icon={faUsers} className="h-8 w-8" />}
                  color="green"
                  sub="with inventory data"
                />
                <StatCard
                  title="Active Items"
                  value={overview.totalItems}
                  icon={<FontAwesomeIcon icon={faBoxes} className="h-8 w-8" />}
                  color="purple"
                  sub="across all users"
                />
                <StatCard
                  title="Total Discarded"
                  value={overview.totalDiscarded}
                  icon={<FontAwesomeIcon icon={faTrash} className="h-8 w-8" />}
                  color="orange"
                  sub="waste items logged"
                />
                <StatCard
                  title="Avg Items / User"
                  value={overview.avgItemsPerUser?.toFixed(1) ?? "—"}
                  icon={<FontAwesomeIcon icon={faChartBar} className="h-8 w-8" />}
                  color="pink"
                  sub="average inventory size"
                />
              </div>

              {/* ── Charts Row ── */}
              <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Top Wasted Ingredients */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl bg-white p-6 shadow-xl"
                >
                  <h2 className="mb-4 font-saveful-bold text-xl text-saveful-green">
                    Top Wasted Ingredients
                  </h2>
                  {overview.topWastedIngredients?.length ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={overview.topWastedIngredients.slice(0, 8)} margin={{ top: 0, right: 0, bottom: 30, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 11, fontFamily: "saveful" }}
                          angle={-35}
                          textAnchor="end"
                          interval={0}
                        />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#2D5F4F" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="font-saveful text-sm text-gray-400">No data yet</p>
                  )}
                </motion.div>

                {/* Waste by Type */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="rounded-2xl bg-white p-6 shadow-xl"
                >
                  <h2 className="mb-4 font-saveful-bold text-xl text-saveful-green">
                    Waste by Type
                  </h2>
                  {overview.wasteByType?.length ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={overview.wasteByType}
                          dataKey="count"
                          nameKey="type"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={(entry: any) =>
                            `${String(entry.type ?? "").replace("_waste", "")} ${((entry.percent ?? 0) * 100).toFixed(0)}%`
                          }
                        >
                          {overview.wasteByType.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="font-saveful text-sm text-gray-400">No data yet</p>
                  )}
                </motion.div>

                {Array.isArray(globalAnalytics?.monthlyTrend) && globalAnalytics.monthlyTrend.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="rounded-2xl bg-white p-6 shadow-xl"
                  >
                    <h2 className="mb-4 font-saveful-bold text-xl text-saveful-green">
                      Monthly Waste Trend
                    </h2>
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={globalAnalytics.monthlyTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="count"
                          stroke="#2D5F4F"
                          strokeWidth={2}
                          dot={{ r: 4, fill: "#2D5F4F" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </motion.div>
                )}

                {/* Discard Reasons */}
                {Array.isArray(globalAnalytics?.byReason) && globalAnalytics.byReason.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="rounded-2xl bg-white p-6 shadow-xl"
                  >
                    <h2 className="mb-4 font-saveful-bold text-xl text-saveful-green">
                      Discard Reasons
                    </h2>
                    <div className="space-y-3">
                      {globalAnalytics.byReason.map((r, i) => (
                        <div key={i}>
                          <div className="mb-1 flex justify-between">
                            <span className="font-saveful text-sm capitalize text-gray-700">
                              {r.reason}
                            </span>
                            <span className="font-saveful text-sm text-saveful-green">
                              {r.percentage?.toFixed(1)}%
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${r.percentage}%` }}
                              transition={{ duration: 0.8, delay: i * 0.1 }}
                              className="h-full rounded-full bg-saveful-green"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </>
          )}

          {/* ── User Search Section ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-xl bg-gradient-to-br from-saveful-green/10 to-saveful-green/5 p-2 text-saveful-green">
                <FontAwesomeIcon icon={faSearch} className="h-5 w-5" />
              </div>
              <h2 className="font-saveful-bold text-xl text-saveful-green">User Inventory Explorer</h2>
            </div>

            {/* Search controls */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <FontAwesomeIcon
                  icon={faUser}
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search by name…"
                  value={nameQuery}
                  onChange={(e) => setNameQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch(1)}
                  className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 font-saveful text-sm text-saveful-black outline-none focus:border-saveful-green focus:ring-2 focus:ring-saveful-green/20"
                />
              </div>
              <div className="relative sm:w-56">
                <FontAwesomeIcon
                  icon={faGlobe}
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                />
                <select
                  value={countryFilter}
                  onChange={(e) => setCountryFilter(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-8 font-saveful text-sm text-saveful-black outline-none focus:border-saveful-green focus:ring-2 focus:ring-saveful-green/20"
                >
                  <option value="">All Countries</option>
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => handleSearch(1)}
                disabled={searchLoading}
                className="flex items-center gap-2 rounded-xl bg-saveful-green px-5 py-2.5 font-saveful text-sm text-white shadow-md hover:bg-saveful-green/90 disabled:opacity-50 transition-all"
              >
                <FontAwesomeIcon icon={faFilter} className="h-4 w-4" />
                {searchLoading ? "Searching…" : "Search"}
              </button>
              {hasSearched && (
                <button
                  onClick={handleClear}
                  className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 font-saveful text-sm text-gray-600 hover:bg-gray-50 transition-all"
                >
                  <FontAwesomeIcon icon={faTimes} className="h-4 w-4" />
                  Clear
                </button>
              )}
            </div>

            {/* Search results */}
            {hasSearched && (
              <div>
                {searchLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />
                    ))}
                  </div>
                ) : usersResult && usersResult.users.length === 0 ? (
                  <p className="py-8 text-center font-saveful text-sm text-gray-400">
                    No users found matching your criteria
                  </p>
                ) : (
                  <>
                    <p className="mb-3 font-saveful text-sm text-gray-500">
                      Showing {usersResult?.users.length ?? 0} of {usersResult?.total ?? 0} users
                    </p>

                    <div className="space-y-3">
                      <AnimatePresence>
                        {usersResult?.users.map((u) => (
                          <UserRow
                            key={u.id}
                            user={u}
                            expanded={expandedUserId === u.id}
                            loading={!!userDetailLoading[u.id]}
                            inventory={userInventoryMap[u.id]}
                            analytics={userAnalyticsMap[u.id]}
                            onToggle={() => handleToggleUser(u.id)}
                          />
                        ))}
                      </AnimatePresence>
                    </div>

                    {/* Pagination */}
                    {usersResult && usersResult.totalPages > 1 && (
                      <div className="mt-6 flex items-center justify-center gap-2">
                        <button
                          disabled={currentPage === 1}
                          onClick={() => handleSearch(currentPage - 1)}
                          className="rounded-lg border border-gray-200 px-3 py-1.5 font-saveful text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                        >
                          Prev
                        </button>
                        {[...Array(usersResult.totalPages)].map((_, i) => (
                          <button
                            key={i}
                            onClick={() => handleSearch(i + 1)}
                            className={`rounded-lg px-3 py-1.5 font-saveful text-sm ${
                              currentPage === i + 1
                                ? "bg-saveful-green text-white"
                                : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            {i + 1}
                          </button>
                        ))}
                        <button
                          disabled={currentPage === usersResult.totalPages}
                          onClick={() => handleSearch(currentPage + 1)}
                          className="rounded-lg border border-gray-200 px-3 py-1.5 font-saveful text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {!hasSearched && (
              <p className="py-6 text-center font-saveful text-sm text-gray-400">
                Enter a name or select a country and click Search to explore user inventories
              </p>
            )}
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}

/* ─────────────────────── UserRow component ─────────────────────── */
function UserRow({
  user,
  expanded,
  loading,
  inventory,
  analytics,
  onToggle,
}: {
  user: AdminUser;
  expanded: boolean;
  loading: boolean;
  inventory?: InventoryGroupedResponse;
  analytics?: WasteAnalytics;
  onToggle: () => void;
}) {
  const joinedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString()
    : "—";

  const vegLabel = user.dietaryProfile?.vegType
    ? user.dietaryProfile.vegType.charAt(0).toUpperCase() + user.dietaryProfile.vegType.slice(1)
    : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:shadow-md"
    >
      {/* User summary row */}
      <button
        className="flex w-full items-center gap-4 p-4 text-left"
        onClick={onToggle}
      >
        {/* Avatar */}
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-saveful-green to-saveful-green/70 text-white shadow-md">
          <span className="font-saveful-bold text-lg">
            {user.name?.charAt(0)?.toUpperCase() ?? "?"}
          </span>
        </div>

        {/* Name / Email */}
        <div className="min-w-0 flex-1">
          <p className="font-saveful-bold text-base text-saveful-black truncate">
            {user.name}
          </p>
          <p className="font-saveful text-sm text-gray-400 truncate">{user.email}</p>
        </div>

        {/* Badges */}
        <div className="hidden flex-wrap gap-2 sm:flex">
          {user.country && (
            <BadgeChip label={user.country} color="bg-blue-50 text-blue-700" />
          )}
          {vegLabel && (
            <BadgeChip label={vegLabel} color="bg-green-50 text-green-700" />
          )}
          {user.dietaryProfile?.dairyFree && (
            <BadgeChip label="Dairy-Free" color="bg-yellow-50 text-yellow-700" />
          )}
          {user.dietaryProfile?.glutenFree && (
            <BadgeChip label="Gluten-Free" color="bg-orange-50 text-orange-700" />
          )}
        </div>

        {/* Joined */}
        <div className="hidden flex-col items-end md:flex">
          <span className="font-saveful text-xs text-gray-400">Joined</span>
          <span className="font-saveful text-sm text-saveful-black">{joinedDate}</span>
        </div>

        {/* Expand icon */}
        <FontAwesomeIcon
          icon={expanded ? faChevronUp : faChevronDown}
          className="h-4 w-4 flex-shrink-0 text-gray-400"
        />
      </button>

      {/* Expanded detail panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-100 p-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-saveful-green border-t-transparent" />
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  {/* ── User Profile ── */}
                  <div className="rounded-xl bg-gray-50 p-4">
                    <h3 className="mb-3 font-saveful-bold text-sm text-saveful-green">
                      User Profile
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <Detail label="Full Name" val={user.name} />
                      <Detail label="Email" val={user.email} />
                      <Detail label="Country" val={user.country} />
                      <Detail label="State / Region" val={user.stateCode} />
                      <Detail label="Joined" val={joinedDate} />
                      {user.onboarding?.pincode && (
                        <Detail label="Pincode" val={user.onboarding.pincode} />
                      )}
                    </div>
                  </div>

                  {/* ── Household & Dietary ── */}
                  <div className="rounded-xl bg-gray-50 p-4">
                    <h3 className="mb-3 font-saveful-bold text-sm text-saveful-green">
                      Dietary Profile
                    </h3>
                    <div className="space-y-2">
                      {user.dietaryProfile?.vegType && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-saveful text-gray-500">Diet Type</span>
                          <BadgeChip
                            label={vegLabel ?? "—"}
                            color="bg-green-100 text-green-700"
                          />
                        </div>
                      )}
                      <DietRow label="Dairy Free" val={user.dietaryProfile?.dairyFree} />
                      <DietRow label="Nut Free" val={user.dietaryProfile?.nutFree} />
                      <DietRow label="Gluten Free" val={user.dietaryProfile?.glutenFree} />
                      <DietRow label="Diabetes" val={user.dietaryProfile?.hasDiabetes} />
                      {(user.dietaryProfile?.otherAllergies?.length ?? 0) > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {user.dietaryProfile!.otherAllergies!.map((a) => (
                            <span
                              key={a}
                              className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-saveful text-red-600"
                            >
                              {a}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {user.onboarding && (
                      <div className="mt-3 border-t border-gray-200 pt-3">
                        <p className="mb-2 font-saveful text-xs text-gray-400">Household</p>
                        <div className="flex gap-4">
                          <Detail label="Adults" val={user.onboarding.noOfAdults} />
                          <Detail label="Children" val={user.onboarding.noOfChildren} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── Inventory Summary ── */}
                  {inventory && (
                    <div className="rounded-xl bg-gray-50 p-4 md:col-span-2">
                      <h3 className="mb-3 font-saveful-bold text-sm text-saveful-green">
                        Inventory Summary
                      </h3>
                      {inventory.summary && (
                        <div className="mb-4 flex flex-wrap gap-3">
                          <BadgeChip
                            label={`${inventory.summary.total} Total`}
                            color="bg-saveful-green/10 text-saveful-green"
                          />
                          <BadgeChip
                            label={`${inventory.summary.fresh} Fresh`}
                            color="bg-green-100 text-green-700"
                          />
                          <BadgeChip
                            label={`${inventory.summary.expiringSoon} Expiring Soon`}
                            color="bg-yellow-100 text-yellow-700"
                          />
                          <BadgeChip
                            label={`${inventory.summary.expired} Expired`}
                            color="bg-red-100 text-red-700"
                          />
                        </div>
                      )}

                      {/* Groups by storage */}
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {Array.isArray(inventory.groups) && inventory.groups.map((g) => {
                          const meta = STORAGE_META[g.location] ?? {
                            label: g.location,
                            color: "bg-gray-100 text-gray-700",
                          };
                          return (
                            <div key={g.location} className="rounded-xl border border-gray-100 bg-white p-3">
                              <div className="mb-2 flex items-center gap-2">
                                <span className={`rounded-lg px-2 py-0.5 text-xs font-saveful ${meta.color}`}>
                                  {meta.label}
                                </span>
                                <span className="font-saveful text-xs text-gray-400">
                                  {g.count} items
                                </span>
                              </div>
                              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                                {Array.isArray(g.items) && g.items.map((item) => (
                                  <div
                                    key={item._id}
                                    className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-1.5"
                                  >
                                    <div className="min-w-0">
                                      <p className="truncate font-saveful text-sm text-saveful-black">
                                        {item.name}
                                      </p>
                                      <p className="font-saveful text-xs text-gray-400">
                                        {item.quantity} {item.unit}
                                      </p>
                                    </div>
                                    <span
                                      className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-saveful ${
                                        FRESHNESS_COLORS[item.freshnessStatus] ?? "bg-gray-100 text-gray-500"
                                      }`}
                                    >
                                      {item.freshnessStatus?.replace("_", " ")}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ── User Waste Analytics ── */}
                  {analytics && (
                    <div className="rounded-xl bg-gray-50 p-4 md:col-span-2">
                      <h3 className="mb-3 font-saveful-bold text-sm text-saveful-green">
                        Waste Analytics
                      </h3>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {/* Top wasted mini-bar */}
                        {Array.isArray(analytics.topWastedItems) && analytics.topWastedItems.length > 0 && (
                          <div>
                            <p className="mb-2 font-saveful text-xs text-gray-500">Top Wasted Items</p>
                            <div className="space-y-2">
                              {analytics.topWastedItems.slice(0, 5).map((it, i) => (
                                <div key={i} className="flex items-center gap-2">
                                  <span className="w-24 truncate font-saveful text-xs text-gray-600">
                                    {it.name}
                                  </span>
                                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                                    <div
                                      className="h-full rounded-full bg-saveful-green"
                                      style={{
                                        width: `${
                                          analytics.topWastedItems[0]?.count
                                            ? (it.count / analytics.topWastedItems[0].count) * 100
                                            : 0
                                        }%`,
                                      }}
                                    />
                                  </div>
                                  <span className="w-6 text-right font-saveful text-xs text-gray-500">
                                    {it.count}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* By reason */}
                        {Array.isArray(analytics.byReason) && analytics.byReason.length > 0 && (
                          <div>
                            <p className="mb-2 font-saveful text-xs text-gray-500">By Reason</p>
                            <div className="space-y-2">
                              {analytics.byReason.map((r, i) => (
                                <div key={i} className="flex items-center justify-between">
                                  <span className="font-saveful text-xs capitalize text-gray-600">
                                    {r.reason}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-200">
                                      <div
                                        className="h-full rounded-full bg-saveful-green"
                                        style={{ width: `${r.percentage}%` }}
                                      />
                                    </div>
                                    <span className="w-8 text-right font-saveful text-xs text-gray-500">
                                      {r.percentage?.toFixed(0)}%
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-2">
                        <BadgeChip
                          label={`Total Discarded: ${analytics.totalDiscarded}`}
                          color="bg-red-50 text-red-600"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}


