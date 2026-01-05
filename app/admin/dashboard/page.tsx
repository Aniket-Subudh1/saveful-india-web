"use client";
import { useAuth, useCurrentUser } from "@/hooks/useAuth";
import { authService } from "@/services/authService";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getAdminSidebarLinks } from "@/config/sidebar";
import { motion } from "motion/react";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState, useEffect } from "react";
import {
  dashboardAnalyticsService,
  DashboardStats,
  PlatformHealth,
} from "@/services/dashboardAnalyticsService";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import {
  faUsers,
  faUserTie,
  faArrowTrendUp,
  faChartLine,
  faExclamationCircle,
  faClock,
  faStar,
  faUtensils,
  faLightbulb,
  faHandHoldingHeart,
  faNewspaper,
  faImage,
  faLeaf,
} from "@fortawesome/free-solid-svg-icons";

const COLORS = {
  purple: "#A68FD9",
  green: "#2D5F4F",
  orange: "#F7931E",
  pink: "#E91E63",
  blue: "#2196F3",
  teal: "#009688",
};

export default function AdminDashboard() {
  const { isLoading } = useAuth("admin");
  const user = useCurrentUser("admin");
  const router = useRouter();
  
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [platformHealth, setPlatformHealth] = useState<PlatformHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && user) {
      fetchDashboardData();
    }
  }, [isLoading, user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [stats, health] = await Promise.all([
        dashboardAnalyticsService.getDashboardStats(),
        dashboardAnalyticsService.getPlatformHealth(),
      ]);
      setDashboardStats(stats);
      setPlatformHealth(health);
    } catch (err: any) {
      console.error("Failed to fetch dashboard data:", err);
      setError(err?.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <DashboardLayout config={sidebarConfig}>
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-saveful-green border-t-transparent mx-auto"></div>
            <div className="text-lg font-saveful text-saveful-green">Loading Dashboard...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout config={sidebarConfig}>
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="text-center">
            <FontAwesomeIcon icon={faExclamationCircle} className="h-16 w-16 text-red-500 mb-4" />
            <div className="text-lg font-saveful text-red-600">{error}</div>
            <button
              onClick={fetchDashboardData}
              className="mt-4 rounded-lg bg-saveful-green px-6 py-2 text-white font-saveful hover:bg-saveful-green/80"
            >
              Retry
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!dashboardStats || !platformHealth) {
    return null;
  }

  // Calculate growth percentages
  const calculateGrowth = (data: { date: string; count: number }[]) => {
    if (data.length < 2) return 0;
    const recent = data.slice(-3).reduce((sum, d) => sum + d.count, 0);
    const previous = data.slice(0, 3).reduce((sum, d) => sum + d.count, 0);
    if (previous === 0) return recent > 0 ? 100 : 0;
    return Math.round(((recent - previous) / previous) * 100);
  };

  const userGrowthPercent = calculateGrowth(dashboardStats.userGrowth);
  const chefGrowthPercent = calculateGrowth(dashboardStats.chefGrowth);

  return (
    <DashboardLayout config={sidebarConfig}>
      <div className="relative h-full overflow-y-auto bg-gradient-to-br from-gray-50 via-saveful-cream/20 to-gray-50 p-4 md:p-8">
        {/* Decorative Background Elements */}
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
                  <FontAwesomeIcon icon={faStar} className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h1 className="mb-1 font-saveful-bold text-4xl text-saveful-green">
                    Dashboard Overview
                  </h1>
                  <p className="font-saveful text-saveful-gray">
                    Welcome back, {user?.name}! Here's what's happening today.
                  </p>
                </div>
              </div>
              <button
                onClick={fetchDashboardData}
                className="rounded-lg bg-white px-4 py-2 text-sm font-saveful text-saveful-green shadow-md hover:shadow-lg transition-all"
              >
                Refresh
              </button>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Users"
              value={dashboardStats.totalUsers.toString()}
              change={userGrowthPercent >= 0 ? `+${userGrowthPercent}%` : `${userGrowthPercent}%`}
              trend={userGrowthPercent >= 0 ? "up" : "down"}
              icon={<FontAwesomeIcon icon={faUsers} className="h-8 w-8" />}
              color="green"
            />
            <StatCard
              title="Total Chefs"
              value={dashboardStats.totalChefs.toString()}
              change={chefGrowthPercent >= 0 ? `+${chefGrowthPercent}%` : `${chefGrowthPercent}%`}
              trend={chefGrowthPercent >= 0 ? "up" : "down"}
              icon={<FontAwesomeIcon icon={faUserTie} className="h-8 w-8" />}
              color="purple"
            />
            <StatCard
              title="Ingredients"
              value={dashboardStats.totalIngredients.toString()}
              change="Active"
              trend="up"
              icon={<FontAwesomeIcon icon={faLeaf} className="h-8 w-8" />}
              color="orange"
            />
            <StatCard
              title="Hacks & Tips"
              value={dashboardStats.totalHacks.toString()}
              change="Published"
              trend="up"
              icon={<FontAwesomeIcon icon={faLightbulb} className="h-8 w-8" />}
              color="pink"
            />
          </div>

          {/* Additional Stats Grid */}
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Sponsors"
              value={dashboardStats.totalSponsors.toString()}
              change="Active"
              trend="up"
              icon={<FontAwesomeIcon icon={faHandHoldingHeart} className="h-8 w-8" />}
              color="purple"
            />
            <StatCard
              title="Food Facts"
              value={dashboardStats.totalFoodFacts.toString()}
              change="Published"
              trend="up"
              icon={<FontAwesomeIcon icon={faNewspaper} className="h-8 w-8" />}
              color="green"
            />
            <StatCard
              title="Stickers"
              value={dashboardStats.totalStickers.toString()}
              change="Available"
              trend="up"
              icon={<FontAwesomeIcon icon={faImage} className="h-8 w-8" />}
              color="orange"
            />
            <StatCard
              title="Profile Completion"
              value={dashboardStats.dietaryProfileCompletionRate}
              change="Users"
              trend="up"
              icon={<FontAwesomeIcon icon={faChartLine} className="h-8 w-8" />}
              color="pink"
            />
          </div>

          {/* Performance Metrics */}
          <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Platform Health Gauge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-xl backdrop-blur-sm transition-all hover:shadow-2xl"
            >
              <div className="relative">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-saveful-bold text-xl text-saveful-green">
                    Platform Health
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
                    <span className="font-saveful text-sm text-green-600">
                      {platformHealth.score >= 80 ? "Excellent" : platformHealth.score >= 60 ? "Good" : "Needs Attention"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-center py-8">
                  <GaugeChart value={platformHealth.score} max={100} />
                </div>
                <div className="grid grid-cols-3 gap-4 border-t border-gray-100 pt-4">
                  <MetricItem label="Uptime" value={platformHealth.uptime} />
                  <MetricItem label="Response" value={platformHealth.responseTime} />
                  <MetricItem label="Load" value={platformHealth.serverLoad} />
                </div>
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="font-saveful text-sm text-gray-600">Active Users (7 days)</span>
                    <span className="font-saveful-semibold text-lg text-saveful-green">
                      {platformHealth.activeUsers}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* User Growth Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-xl backdrop-blur-sm transition-all hover:shadow-2xl"
            >
              <div className="relative">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-saveful-bold text-xl text-saveful-green">
                    User Growth (7 Days)
                  </h3>
                  <FontAwesomeIcon icon={faArrowTrendUp} className="h-5 w-5 text-green-500" />
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={dashboardStats.userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke={COLORS.green} 
                      strokeWidth={3}
                      name="New Users"
                      dot={{ fill: COLORS.green, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

          {/* Charts Row */}
          <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Chef Growth Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-xl backdrop-blur-sm transition-all hover:shadow-2xl"
            >
              <div className="relative">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-saveful-bold text-xl text-saveful-green">
                    Chef Growth (7 Days)
                  </h3>
                  <FontAwesomeIcon icon={faUserTie} className="h-5 w-5 text-saveful-purple" />
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dashboardStats.chefGrowth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <Legend />
                    <Bar 
                      dataKey="count" 
                      fill={COLORS.purple} 
                      name="New Chefs"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Content Distribution Pie Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-xl backdrop-blur-sm transition-all hover:shadow-2xl"
            >
              <div className="relative">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-saveful-bold text-xl text-saveful-green">
                    Content Distribution
                  </h3>
                  <FontAwesomeIcon icon={faChartLine} className="h-5 w-5 text-saveful-orange" />
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Ingredients', value: dashboardStats.totalIngredients },
                        { name: 'Hacks', value: dashboardStats.totalHacks },
                        { name: 'Food Facts', value: dashboardStats.totalFoodFacts },
                        { name: 'Stickers', value: dashboardStats.totalStickers },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill={COLORS.orange} />
                      <Cell fill={COLORS.purple} />
                      <Cell fill={COLORS.green} />
                      <Cell fill={COLORS.pink} />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-xl backdrop-blur-sm transition-all hover:shadow-2xl"
          >
            {/* Background Pattern */}
            <div className="pointer-events-none absolute bottom-0 right-0 opacity-5">
              <Image
                src="/Illustration@2x.png"
                alt=""
                width={200}
                height={200}
                className="object-contain"
              />
            </div>

            <div className="relative">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-saveful-green/10 p-2">
                    <FontAwesomeIcon icon={faChartLine} className="h-6 w-6 text-saveful-green" />
                  </div>
                  <h3 className="font-saveful-bold text-xl text-saveful-green">
                    Recent Activity
                  </h3>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Recent Users */}
                <div>
                  <h4 className="mb-4 font-saveful-semibold text-lg text-saveful-green">
                    Recent Users
                  </h4>
                  <div className="space-y-3">
                    {dashboardStats.recentUsers.length > 0 ? (
                      dashboardStats.recentUsers.map((user) => (
                        <ActivityItem
                          key={user.id}
                          icon={<FontAwesomeIcon icon={faUsers} className="h-5 w-5" />}
                          title="New user registered"
                          description={`${user.name} (${user.email})`}
                          time={getTimeAgo(user.createdAt)}
                          color="green"
                        />
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 font-saveful">No recent users</p>
                    )}
                  </div>
                </div>

                {/* Recent Chefs */}
                <div>
                  <h4 className="mb-4 font-saveful-semibold text-lg text-saveful-purple">
                    Recent Chefs
                  </h4>
                  <div className="space-y-3">
                    {dashboardStats.recentChefs.length > 0 ? (
                      dashboardStats.recentChefs.map((chef) => (
                        <ActivityItem
                          key={chef.id}
                          icon={<FontAwesomeIcon icon={faUserTie} className="h-5 w-5" />}
                          title="New chef joined"
                          description={`${chef.name} (${chef.email})`}
                          time={getTimeAgo(chef.createdAt)}
                          color="purple"
                        />
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 font-saveful">No recent chefs</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Helper function to format time ago
function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  return date.toLocaleDateString();
}

function StatCard({
  title,
  value,
  change,
  trend,
  icon,
  color,
}: {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: React.ReactNode;
  color: "purple" | "green" | "orange" | "pink";
}) {
  const colorClasses = {
    purple: "from-saveful-purple/10 to-saveful-purple/5 text-saveful-purple",
    green: "from-saveful-green/10 to-saveful-green/5 text-saveful-green",
    orange: "from-saveful-orange/10 to-saveful-orange/5 text-saveful-orange",
    pink: "from-saveful-pink/10 to-saveful-pink/5 text-saveful-pink",
  };

  const decorations = {
    purple: "/profile-pink-limes.png",
    green: "/profile-green-apples.png",
    orange: "/eggplant-survey.png",
    pink: "/food.png",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02, y: -5 }}
      className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg transition-all hover:shadow-2xl"
    >
      {/* Background Decoration */}
      <div className="pointer-events-none absolute right-0 top-0 opacity-0 transition-opacity group-hover:opacity-10">
        <Image
          src={decorations[color]}
          alt=""
          width={120}
          height={120}
          className="object-contain"
        />
      </div>

      <div className="relative">
        <div className="mb-4 flex items-center justify-between">
          <div
            className={`rounded-xl bg-gradient-to-br p-3 shadow-md ${colorClasses[color]}`}
          >
            {icon}
          </div>
          <span
            className={`font-saveful-semibold text-sm ${
              trend === "up" ? "text-green-600" : "text-red-600"
            }`}
          >
            {change}
          </span>
        </div>
        <h3 className="mb-1 font-saveful text-sm text-gray-500">{title}</h3>
        <p className="font-saveful-bold text-3xl text-saveful-black">{value}</p>
      </div>
    </motion.div>
  );
}


function GaugeChart({ value, max }: { value: number; max: number }) {
  const percentage = (value / max) * 100;

  return (
    <div className="relative h-48 w-48">
      {/* Background Arc */}
      <svg className="h-full w-full" viewBox="0 0 200 120">
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="#E5E7EB"
          strokeWidth="20"
          strokeLinecap="round"
        />
        {/* Colored Arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="url(#gradient)"
          strokeWidth="20"
          strokeLinecap="round"
          strokeDasharray={`${(percentage / 100) * 251.2} 251.2`}
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#A68FD9" />
            <stop offset="50%" stopColor="#2D5F4F" />
            <stop offset="100%" stopColor="#F7931E" />
          </linearGradient>
        </defs>
      </svg>
      {/* Center Value */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-6">
        <span className="font-saveful-bold text-4xl text-saveful-green">
          {value}%
        </span>
        <span className="font-saveful text-sm text-gray-500">Health Score</span>
      </div>
    </div>
  );
}

function ActivityBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "purple" | "green" | "orange" | "pink";
}) {
  const colorClasses = {
    purple: "bg-saveful-purple",
    green: "bg-saveful-green",
    orange: "bg-saveful-orange",
    pink: "bg-saveful-pink",
  };

  return (
    <div className="flex items-center gap-4">
      <span className="w-12 font-saveful-semibold text-sm text-gray-600">
        {label}
      </span>
      <div className="group relative h-8 flex-1 overflow-hidden rounded-full bg-gray-100 transition-all hover:bg-gray-200">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full ${colorClasses[color]} rounded-full shadow-sm transition-all group-hover:shadow-md`}
        />
      </div>
      <span className="w-12 text-right font-saveful-semibold text-sm text-saveful-black">
        {value}%
      </span>
    </div>
  );
}

function MetricItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="mb-1 font-saveful text-xs text-gray-500">{label}</p>
      <p className="font-saveful-semibold text-sm text-saveful-black">
        {value}
      </p>
    </div>
  );
}

function ActivityItem({
  icon,
  title,
  description,
  time,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  time: string;
  color: "purple" | "green" | "orange" | "pink";
}) {
  const colorClasses = {
    purple: "bg-saveful-purple/10 text-saveful-purple border-saveful-purple/20",
    green: "bg-saveful-green/10 text-saveful-green border-saveful-green/20",
    orange: "bg-saveful-orange/10 text-saveful-orange border-saveful-orange/20",
    pink: "bg-saveful-pink/10 text-saveful-pink border-saveful-pink/20",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.02, x: 5 }}
      className={`flex items-start gap-4 rounded-xl border p-4 transition-all hover:shadow-md ${colorClasses[color]}`}
    >
      <div className={`rounded-lg p-2 ${colorClasses[color]} shadow-sm`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <h4 className="mb-1 font-saveful-semibold text-sm text-saveful-black truncate">
          {title}
        </h4>
        <p className="font-saveful text-xs text-gray-600 truncate">{description}</p>
      </div>
      <span className="font-saveful text-xs text-gray-400 whitespace-nowrap">{time}</span>
    </motion.div>
  );
}
