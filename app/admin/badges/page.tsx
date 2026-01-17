"use client";
import { useAuth, useCurrentUser } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { badgeManagementService, Badge, BadgeStats, BadgeCategory } from "@/services/badgeManagementService";
import { authService } from "@/services/authService";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getAdminSidebarLinks } from "@/config/sidebar";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrophy,
  faPlus,
  faEdit,
  faTrash,
  faChartLine,
  faMedal,
  faStar,
  faAward,
  faUserGraduate,
  faMobileAlt,
  faUtensils,
  faPiggyBank,
  faLeaf,
  faClipboardList,
  faGift,
  faHandshake,
  faFire,
  faCheckCircle,
  faTimesCircle,
} from "@fortawesome/free-solid-svg-icons";

const BADGE_CATEGORIES = [
  { value: BadgeCategory.ONBOARDING, label: "Onboarding", color: "bg-green-500", icon: faUserGraduate },
  { value: BadgeCategory.USAGE, label: "Usage", color: "bg-blue-500", icon: faMobileAlt },
  { value: BadgeCategory.COOKING, label: "Cooking", color: "bg-orange-500", icon: faUtensils },
  { value: BadgeCategory.MONEY_SAVED, label: "Money Saved", color: "bg-green-600", icon: faPiggyBank },
  { value: BadgeCategory.FOOD_SAVED, label: "Food Saved", color: "bg-lime-500", icon: faLeaf },
  { value: BadgeCategory.PLANNING, label: "Planning", color: "bg-purple-500", icon: faClipboardList },
  { value: BadgeCategory.BONUS, label: "Bonus", color: "bg-red-500", icon: faGift },
  { value: BadgeCategory.SPONSOR, label: "Sponsor", color: "bg-pink-500", icon: faHandshake },
  { value: BadgeCategory.CHALLENGE_WINNER, label: "Challenge Winner", color: "bg-yellow-500", icon: faTrophy },
  { value: BadgeCategory.SPECIAL, label: "Special", color: "bg-cyan-500", icon: faStar },
];

export default function BadgesPage() {
  const { isLoading } = useAuth("admin");
  const user = useCurrentUser("admin");
  const router = useRouter();

  const [badges, setBadges] = useState<Badge[]>([]);
  const [stats, setStats] = useState<BadgeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("ALL");

  useEffect(() => {
    if (!isLoading && user) {
      loadBadges();
      loadStats();
    }
  }, [isLoading, user]);

  const loadBadges = async () => {
    try {
      setLoading(true);
      const data = await badgeManagementService.getAllBadges();
      setBadges(data);
    } catch (error: any) {
      console.error("Failed to load badges:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await badgeManagementService.getBadgeStats();
      setStats(statsData);
    } catch (error: any) {
      console.error("Failed to load stats:", error);
    }
  };

  const handleDeleteBadge = async () => {
    if (!selectedBadge) return;
    setIsSubmitting(true);
    try {
      await badgeManagementService.deleteBadge(selectedBadge._id);
      await loadBadges();
      await loadStats();
      setShowDeleteModal(false);
      setSelectedBadge(null);
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to delete badge");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteModal = (badge: Badge) => {
    setSelectedBadge(badge);
    setShowDeleteModal(true);
  };

  const handleLogout = async () => {
    await authService.logout("admin");
    router.push("/admin/login");
  };

  const filteredBadges = filterCategory === "ALL"
    ? badges
    : badges.filter(b => b.category === filterCategory);

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
                <div className="rounded-2xl bg-gradient-to-br from-yellow-500 to-yellow-600 p-4 shadow-xl">
                  <FontAwesomeIcon icon={faTrophy} className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h1 className="mb-1 font-saveful-bold text-4xl text-saveful-green">
                    Badge Management
                  </h1>
                  <p className="font-saveful text-saveful-gray">
                    Create and manage achievement badges
                  </p>
                </div>
              </div>
              <Link href="/admin/badges/create">
                <button className="flex items-center gap-2 rounded-lg bg-saveful-green px-6 py-3 text-white font-saveful shadow-lg hover:bg-saveful-green/90 transition-all">
                  <FontAwesomeIcon icon={faPlus} />
                  Create Badge
                </button>
              </Link>
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
                    <FontAwesomeIcon icon={faTrophy} className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-saveful text-gray-600">Total Badges</p>
                    <p className="text-2xl font-saveful-bold text-gray-900">{stats.totalBadges}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-green-100 p-3">
                    <FontAwesomeIcon icon={faCheckCircle} className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-saveful text-gray-600">Active Badges</p>
                    <p className="text-2xl font-saveful-bold text-gray-900">{stats.activeBadges}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-purple-100 p-3">
                    <FontAwesomeIcon icon={faAward} className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-saveful text-gray-600">Total Awarded</p>
                    <p className="text-2xl font-saveful-bold text-gray-900">{stats.totalAwarded}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-pink-100 p-3">
                    <FontAwesomeIcon icon={faMedal} className="h-6 w-6 text-pink-600" />
                  </div>
                  <div>
                    <p className="text-sm font-saveful text-gray-600">Recipients</p>
                    <p className="text-2xl font-saveful-bold text-gray-900">{stats.uniqueRecipients}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

         
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-6 flex gap-2 overflow-x-auto pb-2"
          >
            <button
              onClick={() => setFilterCategory("ALL")}
              className={`rounded-lg px-6 py-2 font-saveful transition-all ${
                filterCategory === "ALL"
                  ? "bg-saveful-green text-white shadow-lg"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              All Badges
            </button>
            {BADGE_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setFilterCategory(cat.value)}
                className={`flex items-center gap-2 rounded-lg px-6 py-2 font-saveful transition-all ${
                  filterCategory === cat.value
                    ? `${cat.color} text-white shadow-lg`
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <FontAwesomeIcon icon={cat.icon} className="h-4 w-4" />
                {cat.label}
              </button>
            ))}
          </motion.div>

          {/* Badges Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-saveful-green border-t-transparent"></div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              {filteredBadges.map((badge, index) => (
                <motion.div
                  key={badge._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative rounded-2xl bg-white p-6 shadow-lg hover:shadow-xl transition-all"
                >
                  {/* Badge Image */}
                  <div className="mb-4 flex justify-center">
                    <div className="relative h-24 w-24 rounded-full bg-gray-100 p-2">
                      {badge.imageUrl ? (
                        <Image
                          src={badge.imageUrl}
                          alt={badge.name}
                          fill
                          className="object-contain p-2"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <FontAwesomeIcon icon={faTrophy} className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Badge Info */}
                  <div className="text-center">
                    <h3 className="mb-2 font-saveful-bold text-lg text-gray-900">
                      {badge.name}
                    </h3>
                    <p className="mb-3 text-sm font-saveful text-gray-600 line-clamp-2">
                      {badge.description}
                    </p>

                    {/* Category Badge */}
                    <div className="mb-3 flex justify-center">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-saveful text-white ${
                          BADGE_CATEGORIES.find(c => c.value === badge.category)?.color || "bg-gray-500"
                        }`}
                      >
                        {badge.category}
                      </span>
                    </div>

                    {/* Status */}
                    <div className="mb-4 flex items-center justify-center gap-2">
                      {badge.isActive ? (
                        <>
                          <FontAwesomeIcon icon={faCheckCircle} className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-saveful text-green-600">Active</span>
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faTimesCircle} className="h-4 w-4 text-red-600" />
                          <span className="text-sm font-saveful text-red-600">Inactive</span>
                        </>
                      )}
                    </div>

                    {/* Milestone Info */}
                    {badge.milestoneType && (
                      <div className="mb-4 rounded-lg bg-gray-50 p-2">
                        <p className="text-xs font-saveful text-gray-600">
                          {badge.milestoneType}
                        </p>
                        {badge.milestoneThreshold && (
                          <p className="text-xs font-saveful-bold text-gray-900">
                            Threshold: {badge.milestoneThreshold}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link href={`/admin/badges/edit/${badge._id}`} className="flex-1">
                        <button className="w-full rounded-lg bg-blue-500 px-4 py-2 text-sm text-white font-saveful hover:bg-blue-600 transition-all">
                          <FontAwesomeIcon icon={faEdit} className="mr-2" />
                          Edit
                        </button>
                      </Link>
                      <button
                        onClick={() => openDeleteModal(badge)}
                        className="flex-1 rounded-lg bg-red-500 px-4 py-2 text-sm text-white font-saveful hover:bg-red-600 transition-all"
                      >
                        <FontAwesomeIcon icon={faTrash} className="mr-2" />
                        Delete
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {filteredBadges.length === 0 && !loading && (
            <div className="py-20 text-center">
              <FontAwesomeIcon icon={faTrophy} className="h-16 w-16 text-gray-300 mb-4" />
              <p className="text-lg font-saveful text-gray-600">No badges found</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && selectedBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl"
          >
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <FontAwesomeIcon icon={faTrash} className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="mb-2 font-saveful-bold text-2xl text-gray-900">Delete Badge?</h2>
              <p className="font-saveful text-gray-600">
                Are you sure you want to delete <strong>{selectedBadge.name}</strong>?
                This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedBadge(null);
                }}
                className="flex-1 rounded-lg border border-gray-300 px-6 py-3 font-saveful text-gray-700 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteBadge}
                disabled={isSubmitting}
                className="flex-1 rounded-lg bg-red-600 px-6 py-3 font-saveful text-white hover:bg-red-700 disabled:opacity-50 transition-all"
              >
                {isSubmitting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  );
}
