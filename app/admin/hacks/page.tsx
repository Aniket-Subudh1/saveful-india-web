"use client";
import { useAuth, useCurrentUser } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import {
  hackManagementService,
  Hack,
  HackCategory,
} from "@/services/hackManagementService";
import { sponsorManagementService, Sponsor } from "@/services/sponsorManagementService";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getAdminSidebarLinks } from "@/config/sidebar";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faEdit,
  faTrash,
  faSearch,
  faLightbulb,
} from "@fortawesome/free-solid-svg-icons";

export default function HacksPage() {
  const { isLoading } = useAuth("admin");
  const user = useCurrentUser("admin");
  const router = useRouter();

  const [categories, setCategories] = useState<HackCategory[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [hacks, setHacks] = useState<Hack[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteCategoryModal, setShowDeleteCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<HackCategory | null>(null);
  const [hackToDelete, setHackToDelete] = useState<Hack | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<HackCategory | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    heroImage: null as File | null,
    iconImage: null as File | null,
  });

  const [imagePreviews, setImagePreviews] = useState<{
    categoryHero: string | null;
    categoryIcon: string | null;
  }>({
    categoryHero: null,
    categoryIcon: null,
  });

  // Load categories on mount
  useEffect(() => {
    if (!isLoading && user) {
      fetchCategories();
    }
  }, [isLoading, user]);

  // Load hacks when category is selected
  useEffect(() => {
    if (selectedCategory) {
      fetchHacksByCategory(selectedCategory);
    }
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      setLoadingData(true);
      console.log('Fetching categories...');
      const [categoriesData, sponsorsData] = await Promise.all([
        hackManagementService.getAllCategories(),
        sponsorManagementService.getAllSponsors(),
      ]);
      console.log('Categories received:', categoriesData);
      console.log('Sponsors received:', sponsorsData);
      setCategories(categoriesData);
      setSponsors(sponsorsData);
      if (categoriesData.length > 0 && !selectedCategory) {
        console.log('Auto-selecting first category:', categoriesData[0]._id);
        setSelectedCategory(categoriesData[0]._id);
      }
    } catch (error: any) {
      console.error("Error fetching categories:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to fetch categories. Please check your connection and try again.";
      alert(errorMessage);
      setCategories([]);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchHacksByCategory = async (categoryId: string) => {
    try {
      setLoadingData(true);
      console.log('Fetching hacks for category:', categoryId);
      const data = await hackManagementService.getHacksByCategory(categoryId);
      console.log('Received data:', data);
      // The API returns { category, hacks } directly
      const hacksArray = data.hacks || [];
      console.log('Hacks array:', hacksArray);
      setHacks(hacksArray);
    } catch (error: any) {
      console.error("Error fetching hacks:", error);
      setHacks([]);
    } finally {
      setLoadingData(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.heroImage || !categoryForm.iconImage) {
      alert("Please select both hero image and icon image");
      return;
    }

    // No verbose logging in production UI

    setIsSubmitting(true);
    try {
      const result = await hackManagementService.createCategory(
        { name: categoryForm.name },
        categoryForm.heroImage,
        categoryForm.iconImage
      );
      alert("Category created successfully!");
      setShowCategoryModal(false);
      setEditingCategory(null);
      setCategoryForm({ name: "", heroImage: null, iconImage: null });
      setImagePreviews((prev) => ({ ...prev, categoryHero: null, categoryIcon: null }));
      fetchCategories();
    } catch (error: any) {
      console.error("Error creating category:", {
        error,
        message: error?.message,
        response: error?.response,
        data: error?.response?.data,
      });
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to create category. Check console for details.";
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    setIsSubmitting(true);
    try {
      await hackManagementService.updateCategory(
        editingCategory._id,
        { name: categoryForm.name },
        categoryForm.heroImage || undefined,
        categoryForm.iconImage || undefined
      );
      alert("Category updated successfully!");
      setShowCategoryModal(false);
      setEditingCategory(null);
      setCategoryForm({ name: "", heroImage: null, iconImage: null });
      setImagePreviews((prev) => ({ ...prev, categoryHero: null, categoryIcon: null }));
      fetchCategories();
    } catch (error: any) {
      console.error("Error updating category:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to update category";
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };



  const handleDeleteHack = async () => {
    if (!hackToDelete) return;

    setIsSubmitting(true);
    try {
      await hackManagementService.deleteHack(hackToDelete._id);
      alert("Hack deleted successfully!");
      setShowDeleteModal(false);
      setHackToDelete(null);
      if (selectedCategory) {
        fetchHacksByCategory(selectedCategory);
      }
    } catch (error: any) {
      console.error("Error deleting hack:", error);
      alert(error?.response?.data?.message || "Failed to delete hack");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    setIsSubmitting(true);
    try {
      await hackManagementService.deleteCategory(categoryToDelete._id);
      alert("Category deleted successfully!");
      setShowDeleteCategoryModal(false);
      setCategoryToDelete(null);
      setSelectedCategory("");
      fetchCategories();
    } catch (error: any) {
      console.error("Error deleting category:", error);
      const errorMessage = 
        error?.response?.data?.message || 
        error?.message || 
        "Failed to delete category. Please try again.";
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "categoryHero" | "categoryIcon"
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => ({
          ...prev,
          [type]: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);

      if (type === "categoryHero") {
        setCategoryForm((prev) => ({ ...prev, heroImage: file }));
      } else if (type === "categoryIcon") {
        setCategoryForm((prev) => ({ ...prev, iconImage: file }));
      }
    }
  };

  const filteredHacks = hacks.filter((hack) =>
    hack.title.toLowerCase().includes(searchQuery.toLowerCase())
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
        {/* Decorative Background */}
        <div className="pointer-events-none absolute right-0 top-0 opacity-5">
          <svg className="h-96 w-96" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path fill="#F59E0B" d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,79.6,-45.8C87.4,-32.6,90,-16.3,88.5,-0.9C87,14.6,81.4,29.2,72.8,41.7C64.2,54.2,52.6,64.6,39.1,71.8C25.6,79,10.2,83,-5.6,83.3C-21.4,83.6,-42.8,80.2,-58.3,71.2C-73.8,62.2,-83.4,47.6,-87.7,31.8C-92,16,-91,-1,-84.9,-16.2C-78.8,-31.4,-67.6,-44.8,-54.2,-52.4C-40.8,-60,-25.2,-61.8,-10.4,-64.8C4.4,-67.8,8.8,-72,44.7,-76.4Z" transform="translate(100 100)" />
          </svg>
        </div>

        <div className="relative z-10 mx-auto max-w-7xl space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="font-saveful-bold text-3xl text-gray-900 md:text-4xl">Hacks Management</h1>
              <p className="mt-2 font-saveful text-sm text-gray-600">
                Manage hack categories and articles with rich content blocks
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowCategoryModal(true)}
                className="flex items-center gap-2 rounded-lg bg-saveful-orange px-4 py-2.5 font-saveful-semibold text-white shadow-lg transition hover:bg-orange-600 hover:shadow-xl"
              >
                <FontAwesomeIcon icon={faPlus} />
                New Category
              </button>
              <button
                onClick={() => router.push(`/admin/hacks/new${selectedCategory ? `?categoryId=${selectedCategory}` : ''}`)}
                disabled={!selectedCategory}
                className="flex items-center gap-2 rounded-lg bg-saveful-green px-4 py-2.5 font-saveful-semibold text-white shadow-lg transition hover:bg-green-600 hover:shadow-xl disabled:bg-gray-300 disabled:shadow-none"
              >
                <FontAwesomeIcon icon={faPlus} />
                New Hack
              </button>
            </div>
          </div>

          {/* Categories Grid */}
          <div>
            <h2 className="mb-4 font-saveful-bold text-xl text-gray-900">Categories</h2>
            {loadingData && categories.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-saveful-green border-t-transparent"></div>
                <span className="ml-3 font-saveful text-sm text-gray-500">Loading categories...</span>
              </div>
            ) : categories.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
                <div className="mb-4 rounded-full bg-gray-200 p-6 inline-block">
                  <FontAwesomeIcon icon={faLightbulb} className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="font-saveful-bold text-lg text-gray-700">No categories yet</h3>
                <p className="mt-2 font-saveful text-sm text-gray-500">Create your first hack category to get started</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {categories.map((category) => (
                  <motion.div
                    key={category._id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`group relative cursor-pointer rounded-xl border-2 bg-white shadow-md transition hover:shadow-xl ${
                      selectedCategory === category._id
                        ? 'border-saveful-green bg-saveful-green/5'
                        : 'border-gray-200 hover:border-saveful-green/50'
                    }`}
                    onClick={() => setSelectedCategory(category._id)}
                  >
                    {category.heroImageUrl && (
                      <div className="relative h-32 w-full overflow-hidden rounded-t-lg">
                        <Image
                          src={category.heroImageUrl}
                          alt={category.name}
                          fill
                          className="object-cover transition group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                        {/* Icon overlay */}
                        {category.iconImageUrl && (
                          <div className="absolute bottom-2 left-2 h-12 w-12 overflow-hidden rounded-lg bg-white p-1.5 shadow-lg">
                            <div className="relative h-full w-full">
                              <Image
                                src={category.iconImageUrl}
                                alt="icon"
                                fill
                                className="object-contain"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Content Area */}
                    <div className="p-4">
                      {/* Category Name */}
                      <h3 className="mb-3 font-saveful-bold text-base text-gray-900 line-clamp-2 min-h-[3rem]">
                        {category.name}
                      </h3>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2 opacity-0 transition group-hover:opacity-100">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCategory(category);
                            setCategoryForm({
                              name: category.name,
                              heroImage: null,
                              iconImage: null,
                            });
                            setShowCategoryModal(true);
                          }}
                          className="flex-1 rounded-lg bg-blue-500 px-2 py-1.5 font-saveful-semibold text-xs text-white shadow-md transition hover:bg-blue-600"
                        >
                          <FontAwesomeIcon icon={faEdit} className="mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCategoryToDelete(category);
                            setShowDeleteCategoryModal(true);
                          }}
                          className="flex-1 rounded-lg bg-red-500 px-2 py-1.5 font-saveful-semibold text-xs text-white shadow-md transition hover:bg-red-600"
                        >
                          <FontAwesomeIcon icon={faTrash} className="mr-1" />
                          Delete
                        </button>
                      </div>
                    </div>
                    
                    {/* Selected Indicator */}
                    {selectedCategory === category._id && (
                      <div className="absolute right-2 top-2 rounded-full bg-saveful-green p-1.5 shadow-lg">
                        <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Search Bar */}
          {selectedCategory && (
            <div className="relative">
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search hacks by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border-2 border-gray-200 bg-white py-3 pl-11 pr-4 font-saveful shadow-sm transition focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
              />
            </div>
          )}

          {/* Hacks Grid */}
          {selectedCategory && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence>
                {loadingData ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-12">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-saveful-green border-t-transparent"></div>
                    <p className="mt-4 font-saveful text-gray-500">Loading hacks...</p>
                  </div>
                ) : filteredHacks.length === 0 ? (
                  <div className="col-span-full flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 py-16">
                    <div className="mb-4 rounded-full bg-gray-200 p-6">
                      <FontAwesomeIcon icon={faSearch} className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="font-saveful-bold text-lg text-gray-700">
                      {searchQuery ? 'No hacks match your search' : 'No hacks in this category yet'}
                    </h3>
                    <p className="mt-2 font-saveful text-sm text-gray-500">
                      {searchQuery ? 'Try a different search term' : 'Click "New Hack" to create your first hack'}
                    </p>
                  </div>
                ) : (
                filteredHacks.map((hack) => (
                  <motion.div
                    key={hack._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="group rounded-xl border border-gray-200 bg-white p-5 shadow-md transition hover:shadow-xl hover:scale-[1.02]"
                  >
                    {hack.thumbnailImageUrl && (
                      <div className="relative mb-4 h-48 w-full overflow-hidden rounded-lg">
                        <Image
                          src={hack.thumbnailImageUrl}
                          alt={hack.title}
                          fill
                          className="object-cover transition group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                      </div>
                    )}
                    <h3 className="mb-2 font-saveful-bold text-lg text-gray-900 line-clamp-2">
                      {hack.title}
                    </h3>
                    {hack.shortDescription && (
                      <p className="mb-3 font-saveful text-sm text-gray-600 line-clamp-2">
                        {hack.shortDescription}
                      </p>
                    )}
                    <div className="mb-4 flex items-center gap-2">
                      <span className="rounded-full bg-saveful-purple/10 px-3 py-1 font-saveful-bold text-xs text-saveful-purple">
                        {hack.articleBlocks.length} blocks
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/admin/hacks/${hack._id}/edit`)}
                        className="flex-1 rounded-lg bg-blue-500 px-3 py-2.5 font-saveful-semibold text-sm text-white shadow-md transition hover:bg-blue-600 hover:shadow-lg"
                      >
                        <FontAwesomeIcon icon={faEdit} className="mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setHackToDelete(hack);
                          setShowDeleteModal(true);
                        }}
                        className="flex-1 rounded-lg bg-red-500 px-3 py-2.5 font-saveful-semibold text-sm text-white shadow-md transition hover:bg-red-600 hover:shadow-lg"
                      >
                        <FontAwesomeIcon icon={faTrash} className="mr-1" />
                        Delete
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        )}
        </div>
      </div>

      {/* Category Modal */}
      <AnimatePresence>
        {showCategoryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => {
              setShowCategoryModal(false);
              setEditingCategory(null);
              setCategoryForm({ name: "", heroImage: null, iconImage: null });
              setImagePreviews((prev) => ({ ...prev, categoryHero: null, categoryIcon: null }));
            }}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="w-full max-w-md rounded-lg bg-white p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="mb-4 text-xl font-bold">{editingCategory ? 'Edit Category' : 'Create Category'}</h2>
              <form onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Category Name
                  </label>
                  <input
                    type="text"
                    required
                    value={categoryForm.name}
                    onChange={(e) =>
                      setCategoryForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Hero Image {editingCategory && <span className="text-xs text-gray-500">(optional - leave empty to keep current)</span>}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    required={!editingCategory}
                    onChange={(e) => handleImageChange(e, "categoryHero")}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                  {(imagePreviews.categoryHero || editingCategory?.heroImageUrl) && (
                    <div className="relative mt-2 h-32 w-full">
                      <Image
                        src={imagePreviews.categoryHero || editingCategory?.heroImageUrl || ''}
                        alt="Hero Preview"
                        fill
                        className="rounded-lg object-cover"
                      />
                    </div>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Icon Image {editingCategory && <span className="text-xs text-gray-500">(optional - leave empty to keep current)</span>}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    required={!editingCategory}
                    onChange={(e) => handleImageChange(e, "categoryIcon")}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                  {(imagePreviews.categoryIcon || editingCategory?.iconImageUrl) && (
                    <div className="relative mt-2 h-32 w-full">
                      <Image
                        src={imagePreviews.categoryIcon || editingCategory?.iconImageUrl || ''}
                        alt="Icon Preview"
                        fill
                        className="rounded-lg object-cover"
                      />
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCategoryModal(false);
                      setEditingCategory(null);
                      setCategoryForm({ name: "", heroImage: null, iconImage: null });
                      setImagePreviews((prev) => ({ ...prev, categoryHero: null, categoryIcon: null }));
                    }}
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 rounded-lg bg-saveful-green px-4 py-2 text-white hover:bg-green-600 disabled:bg-gray-300"
                  >
                    {isSubmitting ? (editingCategory ? "Updating..." : "Creating...") : (editingCategory ? "Update" : "Create")}
                  </button>
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="w-full max-w-md rounded-lg bg-white p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="mb-4 text-xl font-bold">Confirm Delete</h2>
              <p className="mb-4 text-gray-600">
                Are you sure you want to delete "{hackToDelete?.title}"? This
                action cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteHack}
                  disabled={isSubmitting}
                  className="flex-1 rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600 disabled:bg-gray-300"
                >
                  {isSubmitting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Category Confirmation Modal */}
      <AnimatePresence>
        {showDeleteCategoryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowDeleteCategoryModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="w-full max-w-md rounded-lg bg-white p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="mb-4 text-xl font-bold">Confirm Delete Category</h2>
              <p className="mb-4 text-gray-600">
                Are you sure you want to delete the category "{categoryToDelete?.name}"? 
                All hacks in this category will also be deleted. This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteCategoryModal(false)}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteCategory}
                  disabled={isSubmitting}
                  className="flex-1 rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600 disabled:bg-gray-300"
                >
                  {isSubmitting ? "Deleting..." : "Delete Category"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
