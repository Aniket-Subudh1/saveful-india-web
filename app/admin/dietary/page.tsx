"use client";
import { useAuth, useCurrentUser } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import {
  dietaryManagementService,
  DietCategory,
  CreateDietCategoryDto,
} from "@/services/dietaryManagementService";
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
  faUtensils,
  faSave,
} from "@fortawesome/free-solid-svg-icons";

export default function DietaryPage() {
  const { isLoading } = useAuth("admin");
  const user = useCurrentUser("admin");
  const router = useRouter();

  const [dietCategories, setDietCategories] = useState<DietCategory[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<DietCategory | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<DietCategory | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [categoryForm, setCategoryForm] = useState<CreateDietCategoryDto>({
    name: "",
  });

  useEffect(() => {
    if (!isLoading && user) {
      loadData();
    }
  }, [isLoading, user]);

  const loadData = async () => {
    try {
      setLoadingData(true);
      const data = await dietaryManagementService.getAll();
      setDietCategories(data);
    } catch (error: any) {
      console.error("Failed to load diet categories:", error);
      alert(error?.message || "Failed to load diet categories. Please refresh the page.");
    } finally {
      setLoadingData(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingCategory) {
        await dietaryManagementService.update(editingCategory.id, categoryForm);
      } else {
        await dietaryManagementService.create(categoryForm);
      }

      resetForm();
      setShowModal(false);
      await loadData();
    } catch (error: any) {
      console.error("Failed to save diet category:", error);
      alert(error?.message || "Failed to save diet category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (category: DietCategory) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;

    setIsSubmitting(true);
    try {
      await dietaryManagementService.delete(categoryToDelete.id);
      setShowDeleteModal(false);
      setCategoryToDelete(null);
      await loadData();
    } catch (error: any) {
      console.error("Failed to delete diet category:", error);
      alert(error?.message || "Failed to delete diet category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setEditingCategory(null);
    setCategoryForm({
      name: "",
    });
  };

  const filteredCategories = dietCategories.filter((category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <svg className="h-96 w-96" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path fill="#10B981" d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,79.6,-45.8C87.4,-32.6,90,-16.3,88.5,-0.9C87,14.6,81.4,29.2,72.8,41.7C64.2,54.2,52.6,64.6,39.1,71.8C25.6,79,10.2,83,-5.6,83.3C-21.4,83.6,-42.8,80.2,-58.3,71.2C-73.8,62.2,-83.4,47.6,-87.7,31.8C-92,16,-91,-1,-84.9,-16.2C-78.8,-31.4,-67.6,-44.8,-54.2,-52.4C-40.8,-60,-25.2,-61.8,-10.4,-64.8C4.4,-67.8,8.8,-72,44.7,-76.4Z" transform="translate(100 100)" />
          </svg>
        </div>

        <div className="relative z-10 mx-auto max-w-7xl space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="font-saveful-bold text-3xl text-gray-900 md:text-4xl">
                Dietary Categories
              </h1>
              <p className="mt-2 font-saveful text-sm text-gray-600">
                Manage dietary categories and preferences
              </p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 px-4 py-2.5 font-saveful-semibold text-white shadow-lg transition hover:shadow-xl"
            >
              <FontAwesomeIcon icon={faPlus} />
              New Category
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <FontAwesomeIcon
              icon={faSearch}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border-2 border-gray-200 bg-white py-3 pl-11 pr-4 font-saveful shadow-sm transition focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
            />
          </div>

          {/* Categories Grid */}
          <div className="space-y-4">
            {loadingData ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-green-500 border-t-transparent"></div>
                <p className="mt-4 font-saveful text-gray-500">Loading categories...</p>
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 py-16">
                <div className="mb-4 rounded-full bg-green-100 p-6">
                  <FontAwesomeIcon icon={faUtensils} className="h-12 w-12 text-green-500" />
                </div>
                <h3 className="font-saveful-bold text-lg text-gray-700">
                  {searchQuery ? "No categories match your search" : "No categories yet"}
                </h3>
                <p className="mt-2 font-saveful text-sm text-gray-500">
                  {searchQuery ? "Try a different search term" : "Click 'New Category' to create your first category"}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredCategories.map((category, index) => (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group relative overflow-hidden rounded-xl bg-white p-5 shadow-md transition-all hover:shadow-xl"
                  >
                    {/* Icon */}
                    <div className="mb-3 flex items-center justify-between">
                      <div className="rounded-lg bg-gradient-to-br from-green-100 to-green-50 p-3">
                        <FontAwesomeIcon icon={faUtensils} className="h-5 w-5 text-green-600" />
                      </div>
                      <span className="rounded-full bg-green-100 px-3 py-1 font-saveful-semibold text-xs text-green-700">
                        #{index + 1}
                      </span>
                    </div>

                    {/* Name */}
                    <h3 className="mb-4 font-saveful-bold text-lg text-gray-900">
                      {category.name}
                    </h3>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="flex-1 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 py-2 font-saveful-semibold text-sm text-white shadow transition hover:shadow-md"
                      >
                        <FontAwesomeIcon icon={faEdit} className="mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setCategoryToDelete(category);
                          setShowDeleteModal(true);
                        }}
                        className="flex-1 rounded-lg bg-gradient-to-r from-red-500 to-red-600 py-2 font-saveful-semibold text-sm text-white shadow transition hover:shadow-md"
                      >
                        <FontAwesomeIcon icon={faTrash} className="mr-1" />
                        Delete
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Create/Edit Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
              onClick={() => !isSubmitting && setShowModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="border-b border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/10 p-3">
                        <FontAwesomeIcon icon={faUtensils} className="h-6 w-6 text-green-500" />
                      </div>
                      <h2 className="font-saveful-bold text-2xl text-gray-900">
                        {editingCategory ? "Edit Category" : "Create New Category"}
                      </h2>
                    </div>
                    <button
                      onClick={() => {
                        setShowModal(false);
                        resetForm();
                      }}
                      disabled={isSubmitting}
                      className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                    >
                      <FontAwesomeIcon icon={faTimes} className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6">
                  <div className="space-y-5">
                    {/* Title */}
                    <div>
                      <label className="mb-2 block font-saveful-semibold text-sm text-gray-700">
                        Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={categoryForm.name}
                        onChange={(e) =>
                          setCategoryForm({ ...categoryForm, name: e.target.value })
                        }
                        required
                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 font-saveful transition-all focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                        placeholder="e.g., Vegetarian, Vegan, Keto"
                      />
                    </div>

                    {/* Form Actions */}
                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowModal(false);
                          resetForm();
                        }}
                        disabled={isSubmitting}
                        className="flex-1 rounded-xl border-2 border-gray-200 py-3 font-saveful-semibold text-gray-700 transition-all hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 rounded-xl bg-gradient-to-r from-green-500 to-green-600 py-3 font-saveful-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <>
                            <span className="mr-2">●</span>
                            {editingCategory ? "Updating..." : "Creating..."}
                          </>
                        ) : (
                          <>
                            <FontAwesomeIcon icon={faSave} className="mr-2" />
                            {editingCategory ? "Update Category" : "Create Category"}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
              onClick={() => !isSubmitting && setShowDeleteModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-4 flex justify-center">
                  <div className="rounded-full bg-red-100 p-4">
                    <FontAwesomeIcon icon={faTrash} className="h-8 w-8 text-red-600" />
                  </div>
                </div>
                <h3 className="mb-2 text-center font-saveful-bold text-xl text-gray-900">
                  Delete Category?
                </h3>
                <p className="mb-6 text-center font-saveful text-sm text-gray-600">
                  Are you sure you want to delete "{categoryToDelete?.name}"? This action cannot be
                  undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    disabled={isSubmitting}
                    className="flex-1 rounded-xl border-2 border-gray-200 py-2.5 font-saveful-semibold text-gray-700 transition-all hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isSubmitting}
                    className="flex-1 rounded-xl bg-gradient-to-r from-red-500 to-red-600 py-2.5 font-saveful-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
                  >
                    {isSubmitting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
