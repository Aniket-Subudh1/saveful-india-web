"use client";
import { useAuth, useCurrentUser } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import {
  ratingTagManagementService,
  RatingTag,
  CreateRatingTagDto,
  UpdateRatingTagDto,
} from "@/services/ratingTagManagementService";
import { authService } from "@/services/authService";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getAdminSidebarLinks } from "@/config/sidebar";
import { motion, AnimatePresence } from "motion/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faEdit,
  faTrash,
  faSearch,
  faTimes,
  faSave,
  faToggleOn,
  faToggleOff,
  faStar,
  faArrowUp,
  faArrowDown,
} from "@fortawesome/free-solid-svg-icons";

export default function RatingTagsPage() {
  const { isLoading } = useAuth("admin");
  const user = useCurrentUser("admin");
  const router = useRouter();

  // State management
  const [ratingTags, setRatingTags] = useState<RatingTag[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingTag, setEditingTag] = useState<RatingTag | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<RatingTag | null>(null);

  // Form state
  const [form, setForm] = useState<CreateRatingTagDto>({
    name: "",
    order: 1,
    description: "",
    isActive: true,
  });

  useEffect(() => {
    if (!isLoading && user) {
      loadData();
    }
  }, [isLoading, user]);

  const loadData = async () => {
    try {
      setLoadingData(true);
      const tagsData = await ratingTagManagementService.getAllRatingTags();
      setRatingTags(tagsData);
    } catch (error) {
      console.error("Error loading rating tags:", error);
      alert("Failed to load rating tags");
    } finally {
      setLoadingData(false);
    }
  };

  const resetForm = () => {
    setForm({
      name: "",
      order: 1,
      description: "",
      isActive: true,
    });
    setEditingTag(null);
  };

  const handleOpenModal = (tag?: RatingTag) => {
    if (tag) {
      setEditingTag(tag);
      setForm({
        name: tag.name,
        order: tag.order,
        description: tag.description || "",
        isActive: tag.isActive,
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      if (!form.name.trim()) {
        throw new Error("Name is required");
      }

      if (form.order <= 0) {
        throw new Error("Order must be greater than 0");
      }

      if (editingTag) {
        await ratingTagManagementService.updateRatingTag(editingTag._id, form);
      } else {
        await ratingTagManagementService.createRatingTag(form);
      }

      await loadData();
      handleCloseModal();
    } catch (error: any) {
      console.error("Error saving rating tag:", error);
      alert(error.message || "Failed to save rating tag");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!tagToDelete || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await ratingTagManagementService.deleteRatingTag(tagToDelete._id);
      await loadData();
      setShowDeleteModal(false);
      setTagToDelete(null);
    } catch (error: any) {
      console.error("Error deleting rating tag:", error);
      alert(error.message || "Failed to delete rating tag");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (tag: RatingTag) => {
    try {
      await ratingTagManagementService.updateRatingTag(tag._id, {
        isActive: !tag.isActive,
      });
      await loadData();
    } catch (error: any) {
      console.error("Error toggling active status:", error);
      alert(error.message || "Failed to update rating tag");
    }
  };

  const filteredTags = ratingTags.filter((tag) =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saveful-green mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout config={sidebarConfig}>
      <div className="p-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Rating Tags Management
          </h1>
          <p className="text-gray-600">
            Manage dynamic rating tags for recipe ratings (e.g., Skip, Good,
            Excellent)
          </p>
        </div>

        {/* Actions Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 w-full md:max-w-md">
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search rating tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saveful-green focus:border-transparent"
              />
            </div>

            {/* Add Button */}
            <button
              onClick={() => handleOpenModal()}
              className="w-full md:w-auto bg-saveful-green text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 font-medium shadow-sm"
            >
              <FontAwesomeIcon icon={faPlus} />
              Add Rating Tag
            </button>
          </div>
        </div>

        {/* Rating Tags List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loadingData ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-saveful-green mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading rating tags...</p>
            </div>
          ) : filteredTags.length === 0 ? (
            <div className="text-center py-12">
              <FontAwesomeIcon
                icon={faStar}
                className="text-6xl text-gray-300 mb-4"
              />
              <p className="text-gray-600 text-lg">
                {searchQuery ? "No rating tags found" : "No rating tags yet"}
              </p>
              <p className="text-gray-500 mt-2">
                {searchQuery
                  ? "Try adjusting your search"
                  : "Create your first rating tag to get started"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTags.map((tag) => (
                    <motion.tr
                      key={tag._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon
                            icon={faStar}
                            className="text-saveful-orange"
                          />
                          <span className="text-sm font-medium text-gray-900">
                            {tag.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {tag.order}
                          </span>
                          <span className="text-xs text-gray-500">
                            {tag.order > 7
                              ? "High"
                              : tag.order > 4
                              ? "Medium"
                              : "Low"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {tag.description || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleActive(tag)}
                          className="flex items-center gap-2"
                        >
                          {tag.isActive ? (
                            <>
                              <FontAwesomeIcon
                                icon={faToggleOn}
                                className="text-2xl text-green-500"
                              />
                              <span className="text-sm text-green-600 font-medium">
                                Active
                              </span>
                            </>
                          ) : (
                            <>
                              <FontAwesomeIcon
                                icon={faToggleOff}
                                className="text-2xl text-gray-400"
                              />
                              <span className="text-sm text-gray-500">
                                Inactive
                              </span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenModal(tag)}
                            className="text-saveful-green hover:text-saveful-green/80 p-2 rounded-lg hover:bg-green-50 transition-colors"
                            title="Edit"
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button
                            onClick={() => {
                              setTagToDelete(tag);
                              setShowDeleteModal(true);
                            }}
                            className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <FontAwesomeIcon
              icon={faStar}
              className="text-blue-600 mt-0.5 flex-shrink-0"
            />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">
                About Rating Order
              </h3>
              <p className="text-sm text-blue-800">
                The <strong>order</strong> field determines the priority of the
                rating. Higher order numbers represent better ratings. For
                example: Skip (1), Good (5), Excellent (10). This allows
                flexible rating systems that can be customized to your needs.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingTag ? "Edit Rating Tag" : "Create Rating Tag"}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FontAwesomeIcon icon={faTimes} className="text-xl" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saveful-green focus:border-transparent"
                    placeholder="e.g., Excellent, Good, Skip"
                    required
                  />
                </div>

                {/* Order */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order/Priority <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={form.order}
                    onChange={(e) =>
                      setForm({ ...form, order: Number(e.target.value) })
                    }
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saveful-green focus:border-transparent"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Higher numbers = higher rating priority
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saveful-green focus:border-transparent resize-none"
                    placeholder="Optional description for this rating tag..."
                  />
                </div>

                {/* Active Status */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={form.isActive}
                    onChange={(e) =>
                      setForm({ ...form, isActive: e.target.checked })
                    }
                    className="w-4 h-4 text-saveful-green border-gray-300 rounded focus:ring-saveful-green"
                  />
                  <label
                    htmlFor="isActive"
                    className="text-sm font-medium text-gray-700"
                  >
                    Active
                  </label>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-saveful-green text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faSave} />
                        {editingTag ? "Update" : "Create"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && tagToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Delete Rating Tag
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete &quot;
                <strong>{tagToDelete.name}</strong>&quot;? This action cannot
                be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
