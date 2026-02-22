"use client";
import { useAuth, useCurrentUser } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import {
  leaderboardService,
  LeaderboardEntry,
  LeaderboardPeriod,
  LeaderboardMetric,
  LeaderboardStatsResponse,
} from "@/services/leaderboardService";
import { authService } from "@/services/authService";
import { COUNTRIES } from "@/lib/countries";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getAdminSidebarLinks } from "@/config/sidebar";
import { motion } from "motion/react";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartLine,
  faTrophy,
  faUtensils,
  faLeaf,
  faMedal,
  faUsers,
  faRefresh,
} from "@fortawesome/free-solid-svg-icons";

const PERIOD_OPTIONS: { value: LeaderboardPeriod; label: string; icon: string }[] = [
  { value: "WEEKLY", label: "Weekly", icon: "📅" },
  { value: "MONTHLY", label: "Monthly", icon: "📆" },
  { value: "YEARLY", label: "Yearly", icon: "🗓️" },
  { value: "ALL_TIME", label: "All Time", icon: "♾️" },
];

const METRIC_OPTIONS: { value: LeaderboardMetric; label: string; icon: any }[] = [
  { value: "MEALS_COOKED", label: "Meals Cooked", icon: faUtensils },
  { value: "FOOD_SAVED", label: "Food Saved", icon: faLeaf },
  { value: "BOTH", label: "Combined Score", icon: faChartLine },
];

export default function LeaderboardPage() {
  const { isLoading } = useAuth("admin");
  const user = useCurrentUser("admin");
  const router = useRouter();

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState<LeaderboardStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<LeaderboardPeriod>("MONTHLY");
  const [selectedMetric, setSelectedMetric] = useState<LeaderboardMetric>("BOTH");
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);
  const [countryFilter, setCountryFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");

  useEffect(() => {
    if (!isLoading && user) {
      loadLeaderboard();
      loadStats();
    }
  }, [isLoading, user, selectedPeriod, selectedMetric, limit, offset, countryFilter, stateFilter]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const data = await leaderboardService.getLeaderboard({
        period: selectedPeriod,
        metric: selectedMetric,
        limit,
        offset,
        country: countryFilter || undefined,
        stateCode: stateFilter || undefined,
      });
      setLeaderboard(data.leaderboard);
      setTotalEntries(data.totalEntries);
    } catch (error: any) {
      console.error("Failed to load leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await leaderboardService.getLeaderboardStats();
      setStats(statsData);
    } catch (error: any) {
      console.error("Failed to load stats:", error);
    }
  };

  const handleLogout = async () => {
    await authService.logout("admin");
    router.push("/admin/login");
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    setOffset((newPage - 1) * limit);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setCurrentPage(1);
    setOffset(0);
  };

  const totalPages = Math.ceil(totalEntries / limit) || 1;

  const getRankIcon = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return "text-yellow-600";
    if (rank === 2) return "text-gray-500";
    if (rank === 3) return "text-orange-600";
    return "text-gray-700";
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
          <Image
            src="/Illustration@2x.png"
            alt="Decoration"
            width={500}
            height={500}
            className="object-contain"
          />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-gradient-to-br from-saveful-green to-saveful-green/70 p-4 shadow-xl">
                  <FontAwesomeIcon icon={faChartLine} className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h1 className="mb-1 font-saveful-bold text-4xl text-saveful-green">
                    Leaderboard
                  </h1>
                  <p className="font-saveful text-saveful-gray">
                    Track top performers and their achievements
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  loadLeaderboard();
                  loadStats();
                }}
                className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-saveful text-saveful-green shadow-md hover:shadow-lg transition-all"
              >
                <FontAwesomeIcon icon={faRefresh} />
                Refresh
              </button>
            </div>
          </motion.div>

          {/* Stats Cards */}
          {stats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4"
            >
              <div className="rounded-2xl bg-white p-6 shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-blue-100 p-3">
                    <FontAwesomeIcon icon={faUsers} className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-saveful text-gray-600">Active Users</p>
                    <p className="text-2xl font-saveful-bold text-gray-900">{stats.totalActiveUsers}</p>
                  </div>
                </div>
              </div>

              {stats.topAllTime.length > 0 && (
                <div className="rounded-2xl bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 shadow-lg">
                  <div className="flex items-center gap-4">
                    <div className="rounded-xl bg-yellow-200 p-3">
                      <span className="text-2xl">🥇</span>
                    </div>
                    <div>
                      <p className="text-sm font-saveful text-gray-600">All-Time Leader</p>
                      <p className="text-lg font-saveful-bold text-gray-900">{stats.topAllTime[0].mealsCooked} meals</p>
                    </div>
                  </div>
                </div>
              )}

              {stats.topMonthly.length > 0 && (
                <div className="rounded-2xl bg-gradient-to-br from-green-50 to-green-100 p-6 shadow-lg">
                  <div className="flex items-center gap-4">
                    <div className="rounded-xl bg-green-200 p-3">
                      <FontAwesomeIcon icon={faUtensils} className="h-6 w-6 text-green-700" />
                    </div>
                    <div>
                      <p className="text-sm font-saveful text-gray-600">Monthly Leader</p>
                      <p className="text-lg font-saveful-bold text-gray-900">
                        {stats.topMonthly[0].numberOfMealsCooked} meals
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {stats.topWeekly.length > 0 && (
                <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 p-6 shadow-lg">
                  <div className="flex items-center gap-4">
                    <div className="rounded-xl bg-purple-200 p-3">
                      <FontAwesomeIcon icon={faLeaf} className="h-6 w-6 text-purple-700" />
                    </div>
                    <div>
                      <p className="text-sm font-saveful text-gray-600">Weekly Leader</p>
                      <p className="text-lg font-saveful-bold text-gray-900">
                        {stats.topWeekly[0].foodSavedInKg} kg saved
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-6 rounded-2xl bg-white p-6 shadow-lg"
          >
            <h3 className="mb-4 font-saveful-bold text-lg text-gray-900">Filters</h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              {/* Period Filter */}
              <div>
                <label className="mb-2 block font-saveful text-sm text-gray-700">Time Period</label>
                <div className="grid grid-cols-2 gap-2">
                  {PERIOD_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSelectedPeriod(option.value)}
                      className={`rounded-lg px-3 py-2 text-sm font-saveful transition-all ${
                        selectedPeriod === option.value
                          ? "bg-saveful-green text-white shadow-md"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      <span className="mr-1">{option.icon}</span>
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Metric Filter */}
              <div>
                <label className="mb-2 block font-saveful text-sm text-gray-700">Metric</label>
                <div className="grid grid-cols-1 gap-2">
                  {METRIC_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSelectedMetric(option.value)}
                      className={`rounded-lg px-3 py-2 text-sm font-saveful transition-all ${
                        selectedMetric === option.value
                          ? "bg-saveful-green text-white shadow-md"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      <FontAwesomeIcon icon={option.icon} className="mr-2" />
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location Filters */}
              <div>
                <label className="mb-2 block font-saveful text-sm text-gray-700">Country</label>
                <select
                  value={countryFilter}
                  onChange={(e) => setCountryFilter(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-saveful focus:border-saveful-green focus:outline-none"
                >
                  <option value="">All Countries</option>
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block font-saveful text-sm text-gray-700">State/Region</label>
                <input
                  type="text"
                  value={stateFilter}
                  onChange={(e) => setStateFilter(e.target.value)}
                  placeholder="e.g., MH"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-saveful focus:border-saveful-green focus:outline-none"
                />
              </div>
            </div>

            {/* Limit Selector */}
            <div className="mt-4">
              <label className="mb-2 block font-saveful text-sm text-gray-700">Items per page</label>
              <div className="flex gap-2">
                {[10, 20, 50, 100].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleLimitChange(num)}
                    className={`rounded-lg px-4 py-2 text-sm font-saveful transition-all ${
                      limit === num
                        ? "bg-saveful-green text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Leaderboard Table */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-saveful-green border-t-transparent"></div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="rounded-2xl bg-white shadow-lg overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-saveful-green to-saveful-green/80 text-white">
                    <tr>
                      <th className="px-6 py-4 text-left font-saveful-bold text-sm">Rank</th>
                      <th className="px-6 py-4 text-left font-saveful-bold text-sm">User</th>
                      <th className="px-6 py-4 text-left font-saveful-bold text-sm">Location</th>
                      <th className="px-6 py-4 text-center font-saveful-bold text-sm">Meals Cooked</th>
                      <th className="px-6 py-4 text-center font-saveful-bold text-sm">Food Saved</th>
                      <th className="px-6 py-4 text-center font-saveful-bold text-sm">Money Saved</th>
                      <th className="px-6 py-4 text-center font-saveful-bold text-sm">Badges</th>
                      {selectedMetric === "BOTH" && (
                        <th className="px-6 py-4 text-center font-saveful-bold text-sm">Score</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {leaderboard.map((entry, index) => (
                      <motion.tr
                        key={entry.userId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        {/* Rank */}
                        <td className="px-6 py-4">
                          <div className={`text-2xl font-saveful-bold ${getRankColor(entry.rank)}`}>
                            {getRankIcon(entry.rank)}
                          </div>
                        </td>

                        {/* User Info */}
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-saveful-bold text-gray-900">{entry.userName}</p>
                            <p className="text-sm font-saveful text-gray-500">{entry.userEmail}</p>
                          </div>
                        </td>

                        {/* Location */}
                        <td className="px-6 py-4">
                          <div className="text-sm font-saveful text-gray-700">
                            {entry.stateCode}, {entry.country}
                          </div>
                        </td>

                        {/* Meals Cooked */}
                        <td className="px-6 py-4 text-center">
                          <div className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1">
                            <FontAwesomeIcon icon={faUtensils} className="h-4 w-4 text-orange-600" />
                            <span className="font-saveful-bold text-orange-900">
                              {entry.numberOfMealsCooked}
                            </span>
                          </div>
                        </td>

                        {/* Food Saved */}
                        <td className="px-6 py-4 text-center">
                          <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1">
                            <FontAwesomeIcon icon={faLeaf} className="h-4 w-4 text-green-600" />
                            <span className="font-saveful-bold text-green-900">
                              {entry.foodSavedInKg} kg
                            </span>
                          </div>
                        </td>

                        {/* Money Saved */}
                        <td className="px-6 py-4 text-center">
                          <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1">
                            <span className="text-blue-600">₹</span>
                            <span className="font-saveful-bold text-blue-900">
                              {(entry.totalMoneySaved || 0).toFixed(0)}
                            </span>
                          </div>
                        </td>

                        {/* Badges */}
                        <td className="px-6 py-4 text-center">
                          <div className="inline-flex items-center gap-2 rounded-full bg-yellow-100 px-3 py-1">
                            <FontAwesomeIcon icon={faTrophy} className="h-4 w-4 text-yellow-600" />
                            <span className="font-saveful-bold text-yellow-900">
                              {entry.badgeCount}
                            </span>
                          </div>
                        </td>

                        {/* Combined Score */}
                        {selectedMetric === "BOTH" && (
                          <td className="px-6 py-4 text-center">
                            <span className="font-saveful-bold text-saveful-green">
                              {entry.combinedScore?.toFixed(1)}
                            </span>
                          </td>
                        )}
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {leaderboard.length === 0 && (
                <div className="py-20 text-center">
                  <FontAwesomeIcon icon={faChartLine} className="h-16 w-16 text-gray-300 mb-4" />
                  <p className="text-lg font-saveful text-gray-600">No leaderboard data found</p>
                  <p className="text-sm font-saveful text-gray-500 mt-2">
                    Try adjusting your filters
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* Pagination */}
          {!loading && leaderboard.length > 0 && totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-6 flex items-center justify-between rounded-2xl bg-white p-6 shadow-lg"
            >
              <div className="text-sm font-saveful text-gray-600">
                Showing {offset + 1} to {Math.min(offset + limit, totalEntries)} of {totalEntries} entries
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-saveful text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Previous
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`h-10 w-10 rounded-lg text-sm font-saveful transition-all ${
                          currentPage === pageNum
                            ? "bg-saveful-green text-white shadow-md"
                            : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-saveful text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
