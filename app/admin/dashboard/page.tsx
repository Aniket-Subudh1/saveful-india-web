"use client";
import { useAuth, useCurrentUser } from "@/hooks/useAuth";
import { authService } from "@/services/authService";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getAdminSidebarLinks } from "@/config/sidebar";
import { motion } from "motion/react";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faUsers,
  faUserTie,
  faArrowTrendUp,
  faChartLine,
  faExclamationCircle,
  faClock,
  faStar,
} from "@fortawesome/free-solid-svg-icons";


export default function AdminDashboard() {
  const { isLoading } = useAuth("admin");
  const user = useCurrentUser("admin");
  const router = useRouter();

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
        <div className="pointer-events-none absolute bottom-0 left-0 opacity-10">
          <Image
            src="/money.png"
            alt="Money"
            width={200}
            height={200}
            className="object-contain"
          />
        </div>
        <div className="pointer-events-none absolute right-1/4 top-1/4 opacity-5">
          <Image
            src="/food.png"
            alt="Food"
            width={150}
            height={150}
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
          </motion.div>

          {/* Stats Grid */}
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Chefs"
              value="24"
              change="+12%"
              trend="up"
              icon={<FontAwesomeIcon icon={faUserTie} className="h-8 w-8" />}
              color="purple"
            />
            <StatCard
              title="Active Users"
              value="1,234"
              change="+23%"
              trend="up"
              icon={<FontAwesomeIcon icon={faUsers} className="h-8 w-8" />}
              color="green"
            />
            <StatCard
              title="Total Recipes"
              value="342"
              change="+8%"
              trend="up"
              icon={<FontAwesomeIcon icon={faChartLine} className="h-8 w-8" />}
              color="orange"
            />
            <StatCard
              title="Pending Reviews"
              value="18"
              change="-5%"
              trend="down"
              icon={<FontAwesomeIcon icon={faExclamationCircle} className="h-8 w-8" />}
              color="pink"
            />
          </div>

          {/* Performance Metrics */}
          <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Gauge Chart */}
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
                      Excellent
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-center py-8">
                  <GaugeChart value={87} max={100} />
                </div>
                <div className="grid grid-cols-3 gap-4 border-t border-gray-100 pt-4">
                  <MetricItem label="Uptime" value="99.9%" />
                  <MetricItem label="Response" value="120ms" />
                  <MetricItem label="Load" value="Low" />
                </div>
              </div>
            </motion.div>

            {/* Activity Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-xl backdrop-blur-sm transition-all hover:shadow-2xl"
            >
              {/* Background Pattern */}
              <div className="pointer-events-none absolute left-0 top-0 opacity-5">
                <Image
                  src="/challenge-ribbon.png"
                  alt=""
                  width={150}
                  height={150}
                  className="object-contain"
                />
              </div>
              
              <div className="relative">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-saveful-bold text-xl text-saveful-green">
                    Weekly Activity
                  </h3>
                  <FontAwesomeIcon icon={faArrowTrendUp} className="h-5 w-5 text-green-500" />
                </div>
                <div className="space-y-4">
                  <ActivityBar label="Mon" value={65} color="purple" />
                  <ActivityBar label="Tue" value={78} color="green" />
                  <ActivityBar label="Wed" value={92} color="orange" />
                  <ActivityBar label="Thu" value={88} color="pink" />
                  <ActivityBar label="Fri" value={95} color="purple" />
                  <ActivityBar label="Sat" value={72} color="green" />
                  <ActivityBar label="Sun" value={58} color="orange" />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
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
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-1 font-saveful text-sm text-saveful-purple transition-colors hover:text-saveful-pink hover:underline"
                >
                  View All <FontAwesomeIcon icon={faArrowTrendUp} className="h-4 w-4" />
                </motion.button>
              </div>
              <div className="space-y-3">
                <ActivityItem
                  icon={<FontAwesomeIcon icon={faUserTie} className="h-5 w-5" />}
                  title="New chef registered"
                  description="Chef John Doe joined the platform"
                  time="2 hours ago"
                  color="purple"
                />
                <ActivityItem
                  icon={<FontAwesomeIcon icon={faUsers} className="h-5 w-5" />}
                  title="User milestone reached"
                  description="Platform reached 1,000 active users"
                  time="5 hours ago"
                  color="green"
                />
                <ActivityItem
                  icon={<FontAwesomeIcon icon={faChartLine} className="h-5 w-5" />}
                  title="Recipe published"
                  description="'Butter Chicken' recipe went live"
                  time="1 day ago"
                  color="orange"
                />
                <ActivityItem
                  icon={<FontAwesomeIcon icon={faClock} className="h-5 w-5" />}
                  title="System update"
                  description="Platform maintenance completed"
                  time="2 days ago"
                  color="pink"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
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
      <div className="flex-1">
        <h4 className="mb-1 font-saveful-semibold text-sm text-saveful-black">
          {title}
        </h4>
        <p className="font-saveful text-sm text-gray-600">{description}</p>
      </div>
      <span className="font-saveful text-xs text-gray-400">{time}</span>
    </motion.div>
  );
}
