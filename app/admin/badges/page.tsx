"use client";
import { useAuth, useCurrentUser } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { badgeManagementService, Badge, BadgeStats } from "@/services/badgeManagementService";
import { authService } from "@/services/authService";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getAdminSidebarLinks } from "@/config/sidebar";
import { motion } from "motion/react";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrophy,
  faPlus,
  faEdit,
  faTrash,
  faCheck,
  faTimes,
  faUpload,
  faChartLine,
  faMedal,
  faStar,
  faAward,
} from "@fortawesome/free-solid-svg-icons";

const BADGE_CATEGORIES = [
  { value: "MILESTONE", label: "Milestone", color: "bg-blue-500" },
  { value: "CHALLENGE_WINNER", label: "Challenge Winner", color: "bg-yellow-500" },
  { value: "SPECIAL", label: "Special", color: "bg-purple-500" },
];

const MILESTONE_TYPES = [
  "TOTAL_MEALS_COOKED",
  "TOTAL_FOOD_SAVED",
  "MONTHLY_MEALS_COOKED",
  "YEARLY_MEALS_COOKED",
  "MONTHLY_FOOD_SAVED",
  "YEARLY_FOOD_SAVED",
  "COOKING_STREAK",
  "CHALLENGE_PARTICIPATION",
];

export default function BadgesPage() {
  const { isLoading } = useAuth("admin");
  const user = useCurrentUser("admin");
  const router = useRouter();

  const [badges, setBadges] = useState<Badge[]>([]);
  const [stats, setStats] = useState<BadgeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    imageUrl: "",
    category: "MILESTONE" as "MILESTONE" | "CHALLENGE_WINNER" | "SPECIAL",
    milestoneType: "",
    threshold: 0,
  });

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };



  const handleCreateBadge = async () => {
    setIsSubmitting(true);
    try {
      await badgeManagementService.createBadge(formData, imageFile || undefined);
      await loadBadges();
      await loadStats();
      setShowCreateModal(false);
      resetForm();
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to create badge");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateBadge = async () => {
    if (!selectedBadge) return;
    setIsSubmitting(true);
    try {
      await badgeManagementService.updateBadge(selectedBadge._id, formData, imageFile || undefined);
      await loadBadges();
      await loadStats();
      setShowEditModal(false);
      resetForm();
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to update badge");
    } finally {
      setIsSubmitting(false);
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

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (badge: Badge) => {
    setSelectedBadge(badge);
    setFormData({
      name: badge.name,
      description: badge.description,
      imageUrl: badge.imageUrl,
      category: badge.category,
      milestoneType: badge.milestoneType || "",
      threshold: badge.threshold || 0,
    });
    setImagePreview(badge.imageUrl);
    setShowEditModal(true);
  };

  const openDeleteModal = (badge: Badge) => {
    setSelectedBadge(badge);
    setShowDeleteModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      imageUrl: "",
      category: "MILESTONE",
      milestoneType: "",
      threshold: 0,
    });
    setImageFile(null);
    setImagePreview("");
    setSelectedBadge(null);
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
              <button
                onClick={openCreateModal}
                className="flex items-center gap-2 rounded-lg bg-saveful-green px-6 py-3 text-white font-saveful shadow-lg hover:bg-saveful-green/90 transition-all"
              >
                <FontAwesomeIcon icon={faPlus} />
                Create Badge
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
                    <FontAwesomeIcon icon={faCheck} className="h-6 w-6 text-green-600" />
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
                  <div className="rounded-xl bg-yellow-100 p-3">
                    <FontAwesomeIcon icon={faStar} className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm font-saveful text-gray-600">Recipients</p>
                    <p className="text-2xl font-saveful-bold text-gray-900">{stats.uniqueRecipients}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Filter Tabs */}
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
                className={`rounded-lg px-6 py-2 font-saveful transition-all ${
                  filterCategory === cat.value
                    ? `${cat.color} text-white shadow-lg`
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
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
                          <FontAwesomeIcon icon={faCheck} className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-saveful text-green-600">Active</span>
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faTimes} className="h-4 w-4 text-red-600" />
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
                        {badge.threshold && (
                          <p className="text-xs font-saveful-bold text-gray-900">
                            Threshold: {badge.threshold}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(badge)}
                        className="flex-1 rounded-lg bg-blue-500 px-4 py-2 text-sm text-white font-saveful hover:bg-blue-600 transition-all"
                      >
                        <FontAwesomeIcon icon={faEdit} className="mr-2" />
                        Edit
                      </button>
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

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <h2 className="mb-6 font-saveful-bold text-2xl text-gray-900">
              {showCreateModal ? "Create New Badge" : "Edit Badge"}
            </h2>

            <div className="space-y-4">
              {/* Image Upload */}
              <div>
                <label className="mb-2 block font-saveful text-sm text-gray-700">
                  Badge Image
                </label>
                <div className="flex items-center gap-4">
                  <div className="h-24 w-24 rounded-full bg-gray-100 overflow-hidden">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <FontAwesomeIcon icon={faTrophy} className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <label className="cursor-pointer rounded-lg bg-gray-100 px-4 py-2 font-saveful text-sm hover:bg-gray-200">
                    <FontAwesomeIcon icon={faUpload} className="mr-2" />
                    Upload Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="mb-2 block font-saveful text-sm text-gray-700">
                  Badge Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 font-saveful focus:border-saveful-green focus:outline-none"
                  placeholder="Enter badge name"
                />
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 block font-saveful text-sm text-gray-700">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 font-saveful focus:border-saveful-green focus:outline-none"
                  placeholder="Enter badge description"
                />
              </div>

              {/* Category */}
              <div>
                <label className="mb-2 block font-saveful text-sm text-gray-700">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 font-saveful focus:border-saveful-green focus:outline-none"
                >
                  {BADGE_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Milestone Type */}
              {formData.category === "MILESTONE" && (
                <>
                  <div>
                    <label className="mb-2 block font-saveful text-sm text-gray-700">
                      Milestone Type
                    </label>
                    <select
                      value={formData.milestoneType}
                      onChange={(e) => setFormData({ ...formData, milestoneType: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 font-saveful focus:border-saveful-green focus:outline-none"
                    >
                      <option value="">Select milestone type</option>
                      {MILESTONE_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block font-saveful text-sm text-gray-700">
                      Threshold
                    </label>
                    <input
                      type="number"
                      value={formData.threshold}
                      onChange={(e) => setFormData({ ...formData, threshold: parseInt(e.target.value) })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 font-saveful focus:border-saveful-green focus:outline-none"
                      placeholder="Enter threshold value"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="mt-8 flex gap-4">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  resetForm();
                }}
                className="flex-1 rounded-lg border border-gray-300 px-6 py-3 font-saveful text-gray-700 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={showCreateModal ? handleCreateBadge : handleUpdateBadge}
                disabled={isSubmitting || !formData.name || !formData.description}
                className="flex-1 rounded-lg bg-saveful-green px-6 py-3 font-saveful text-white hover:bg-saveful-green/90 disabled:opacity-50 transition-all"
              >
                {isSubmitting ? "Saving..." : showCreateModal ? "Create Badge" : "Update Badge"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

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
