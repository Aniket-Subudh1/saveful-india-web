"use client";
import { useAuth, useCurrentUser } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import {
  frameworkCategoryManagementService,
  FrameworkCategory,
} from "@/services/frameworkCategoryManagementService";
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
  faTag,
} from "@fortawesome/free-solid-svg-icons";

export default function FrameworkCategoriesPage() {
  const { isLoading } = useAuth("admin");
  const user = useCurrentUser("admin");
  const router = useRouter();

  const [categories, setCategories] = useState<FrameworkCategory[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<FrameworkCategory | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      fetchCategories();
    }
  }, [isLoading, user]);

  const fetchCategories = async () => {
    try {
      setLoadingData(true);
      const data = await frameworkCategoryManagementService.getAllCategories();
      setCategories(data);
    } catch (error: any) {
      console.error("Error fetching categories:", error);
      const errorMessage =
        error?.response?.data?.message || error?.message || "Failed to fetch categories.";
      alert(errorMessage);
      setCategories([]);
    } finally {
      setLoadingData(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    setIsSubmitting(true);
    try {
      await frameworkCategoryManagementService.deleteCategory(categoryToDelete._id);
      alert("Framework category deleted successfully!");
      setShowDeleteModal(false);
      setCategoryToDelete(null);
      fetchCategories();
    } catch (error: any) {
      console.error("Error deleting category:", error);
      alert(error?.response?.data?.message || "Failed to delete framework category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCategories = categories.filter((category) =>
    category.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const handleLogout = () => {
    router.push("/admin/login");
  };

  const sidebarConfig = {
    role: "admin" as const,
    userName: user?.name || "Admin",
    userEmail: user?.email || "",
    links: getAdminSidebarLinks(handleLogout),
  };

  return (
    <DashboardLayout config={sidebarConfig}>
      <div className="relative h-full overflow-y-auto bg-gradient-to-br from-gray-50 via-saveful-cream/20 to-gray-50 p-4 md:p-8">
        <div className="pointer-events-none absolute right-0 top-0 opacity-5">
          <svg className="h-96 w-96" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path fill="#F59E0B" d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,79.6,-45.8C87.4,-32.6,90,-16.3,88.5,-0.9C87,14.6,81.4,29.2,72.8,41.7C64.2,54.2,52.6,64.6,39.1,71.8C25.6,79,10.2,83,-5.6,83.3C-21.4,83.6,-42.8,80.2,-58.3,71.2C-73.8,62.2,-83.4,47.6,-87.7,31.8C-92,16,-91,-1,-84.9,-16.2C-78.8,-31.4,-67.6,-44.8,-54.2,-52.4C-40.8,-60,-25.2,-61.8,-10.4,-64.8C4.4,-67.8,8.8,-72,44.7,-76.4Z" transform="translate(100 100)" />
          </svg>
        </div>

        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="font-saveful-bold text-3xl text-gray-900">Framework Categories</h1>
              <p className="mt-1 font-saveful text-sm text-gray-600">
                Manage framework categories for recipes and content
              </p>
            </div>
            <button
              onClick={() => router.push("/admin/framework-categories/new")}
              className="flex items-center gap-2 rounded-lg bg-saveful-green px-4 py-2.5 font-saveful-semibold text-white shadow-md transition hover:bg-green-600 hover:shadow-lg"
            >
              <FontAwesomeIcon icon={faPlus} />
              Create Category
            </button>
          </div>

          <div className="mb-6">
            <div className="relative">
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 font-saveful focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
              />
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md">
            {loadingData ? (
              <div className="py-12 text-center">
                <div className="font-saveful text-gray-500">Loading categories...</div>
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="py-12 text-center">
                <FontAwesomeIcon icon={faTag} className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                <p className="font-saveful text-gray-500">
                  {searchQuery ? "No categories match your search" : "No categories found"}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence>
                  {filteredCategories.map((category) => (
                    <motion.div
                      key={category._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="overflow-hidden rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                    >
                      <h3 className="mb-2 font-saveful-bold text-lg text-gray-900">
                        {category.title}
                      </h3>
                      <div
                        className="mb-3 line-clamp-3 font-saveful text-sm text-gray-600"
                        dangerouslySetInnerHTML={{ __html: category.description || '' }}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            router.push(`/admin/framework-categories/${category._id}`)
                          }
                          className="flex-1 rounded-lg border border-saveful-green px-3 py-2 font-saveful-semibold text-sm text-saveful-green transition hover:bg-saveful-green hover:text-white"
                        >
                          <FontAwesomeIcon icon={faEdit} className="mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setCategoryToDelete(category);
                            setShowDeleteModal(true);
                          }}
                          className="flex-1 rounded-lg border border-red-500 px-3 py-2 font-saveful-semibold text-sm text-red-500 transition hover:bg-red-500 hover:text-white"
                        >
                          <FontAwesomeIcon icon={faTrash} className="mr-1" />
                          Delete
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>

      {showDeleteModal && categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
          >
            <h3 className="mb-2 font-saveful-bold text-xl text-gray-900">Delete Category</h3>
            <p className="mb-4 font-saveful text-gray-600">
              Are you sure you want to delete "{categoryToDelete.title}"? This action cannot be
              undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setCategoryToDelete(null);
                }}
                disabled={isSubmitting}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-saveful-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCategory}
                disabled={isSubmitting}
                className="flex-1 rounded-lg bg-red-500 px-4 py-2 font-saveful-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
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
