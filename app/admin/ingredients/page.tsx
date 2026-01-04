"use client";
import { useAuth, useCurrentUser } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import {
  ingredientManagementService,
  Ingredient,
  IngredientCategory,
  IngredientTheme,
  Month,
  CreateIngredientDto,
  UpdateIngredientDto,
} from "@/services/ingredientManagementService";
import { dietManagementService, DietCategory } from "@/services/dietManagementService";
import { sponsorManagementService, Sponsor } from "@/services/sponsorManagementService";
import { hackOrTipManagementService, HackOrTip } from "@/services/hackOrTipManagementService";
import { stickerManagementService, Sticker } from "@/services/stickerManagementService";
import { authService } from "@/services/authService";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getAdminSidebarLinks } from "@/config/sidebar";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faEdit,
  faTrash,
  faSearch,
  faTimes,
  faLeaf,
  faUpload,
  faSave,
  faToggleOn,
  faToggleOff,
  faTag,
} from "@fortawesome/free-solid-svg-icons";

const MONTHS = Object.values(Month);
const THEMES = Object.values(IngredientTheme);

export default function IngredientsPage() {
  const { isLoading } = useAuth("admin");
  const user = useCurrentUser("admin");
  const router = useRouter();

  // State management
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [categories, setCategories] = useState<IngredientCategory[]>([]);
  const [diets, setDiets] = useState<DietCategory[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [hacks, setHacks] = useState<HackOrTip[]>([]);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<IngredientCategory | null>(null);
  const [showDeleteCategoryModal, setShowDeleteCategoryModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<IngredientCategory | null>(null);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [ingredientToDelete, setIngredientToDelete] = useState<Ingredient | null>(null);

  // Form state
  const [form, setForm] = useState<CreateIngredientDto>({
    name: "",
    averageWeight: 1,
    categoryId: "",
    suitableDiets: [],
    hasPage: false,
    isPantryItem: false,
  });

  const [heroImageFile, setHeroImageFile] = useState<File | null>(null);
  const [heroImagePreview, setHeroImagePreview] = useState<string | null>(null);

  // Category form state
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    image: undefined as File | undefined,
  });
  const [categoryImagePreview, setCategoryImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && user) {
      loadData();
    }
  }, [isLoading, user]);

  const loadData = async () => {
    try {
      setLoadingData(true);
      
      // Load data with error handling for each service
      const [ingredientsData, categoriesData, dietsData, sponsorsData, hacksData, stickersData] =
        await Promise.allSettled([
          ingredientManagementService.getAllIngredients().catch(() => []),
          ingredientManagementService.getAllCategories().catch(() => []),
          dietManagementService.getAllDiets().catch(() => []),
          sponsorManagementService.getAllSponsors().catch(() => []),
          hackOrTipManagementService.getAll().catch(() => []),
          stickerManagementService.getAll().catch(() => []),
        ]);

      setIngredients(ingredientsData.status === 'fulfilled' ? ingredientsData.value : []);
      setCategories(categoriesData.status === 'fulfilled' ? categoriesData.value : []);
      setDiets(dietsData.status === 'fulfilled' ? dietsData.value : []);
      setSponsors(sponsorsData.status === 'fulfilled' ? sponsorsData.value : []);
      setHacks(hacksData.status === 'fulfilled' ? hacksData.value : []);
      setStickers(stickersData.status === 'fulfilled' ? stickersData.value : []);
    } catch (error: any) {
      console.error("Failed to load data:", error);
      alert("Failed to load data. Please refresh the page.");
    } finally {
      setLoadingData(false);
    }
  };

  const handleLogout = () => {
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
      // Validate basic fields
      if (!form.name.trim()) {
        alert("Please enter an ingredient name");
        setIsSubmitting(false);
        return;
      }

      if (form.averageWeight <= 0) {
        alert("Average weight must be greater than 0");
        setIsSubmitting(false);
        return;
      }

      if (!form.categoryId) {
        alert("Please select a category");
        setIsSubmitting(false);
        return;
      }

      if (!form.suitableDiets || form.suitableDiets.length === 0) {
        alert("Please select at least one suitable diet");
        setIsSubmitting(false);
        return;
      }

      // Validate hasPage fields
      if (form.hasPage) {
        if (!form.theme) {
          alert("Please select a theme when 'Has Page' is enabled");
          setIsSubmitting(false);
          return;
        }

        if (!form.inSeason || form.inSeason.length === 0) {
          alert("Please select at least one month for 'In Season' when 'Has Page' is enabled");
          setIsSubmitting(false);
          return;
        }
      }

      const files = heroImageFile ? { heroImage: heroImageFile } : undefined;

      if (editingIngredient) {
        await ingredientManagementService.updateIngredient(
          editingIngredient._id,
          form,
          files
        );
        alert("Ingredient updated successfully!");
      } else {
        await ingredientManagementService.createIngredient(form, files);
        alert("Ingredient created successfully!");
      }

      resetForm();
      setShowModal(false);
      await loadData();
    } catch (error: any) {
      console.error("Failed to save ingredient:", error);
      alert(error?.message || "Failed to save ingredient");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (ingredient: Ingredient) => {
    router.push(`/admin/ingredients/${ingredient._id}/edit`);
  };

  const handleDelete = async () => {
    if (!ingredientToDelete) return;

    setIsSubmitting(true);
    try {
      await ingredientManagementService.deleteIngredient(ingredientToDelete._id);
      setShowDeleteModal(false);
      setIngredientToDelete(null);
      await loadData();
    } catch (error: any) {
      console.error("Failed to delete ingredient:", error);
      alert(error?.response?.data?.message || "Failed to delete ingredient");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setEditingIngredient(null);
    setForm({
      name: "",
      averageWeight: 1,
      categoryId: "",
      suitableDiets: [],
      hasPage: false,
      isPantryItem: false,
    });
    setHeroImageFile(null);
    setHeroImagePreview(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setHeroImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setHeroImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCategoryImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCategoryForm({ ...categoryForm, image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setCategoryImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("name", categoryForm.name);
      
      // Only append image if a new one is selected
      // When editing without new image, backend should preserve existing image
      if (categoryForm.image) {
        formData.append("image", categoryForm.image);
      } else if (editingCategory && editingCategory.imageUrl) {
        // If editing and no new image, we'll let the backend keep the existing one
        // The backend should handle this - only update image if provided
      }

      const token = authService.getStoredToken("admin");
      if (!token) throw new Error("No authentication token");

      const url = editingCategory
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/ingredients/category/${editingCategory._id || editingCategory.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/ingredients/category`;
      
      const method = editingCategory ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to ${editingCategory ? 'update' : 'create'} category`);
      }

      setCategoryForm({ name: "", image: undefined });
      setCategoryImagePreview(null);
      setEditingCategory(null);
      setShowCategoryModal(false);
      await loadData();
      alert(`Category ${editingCategory ? 'updated' : 'created'} successfully!`);
    } catch (error: any) {
      console.error("Failed to save category:", error);
      alert(error?.message || "Failed to save category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCategory = (category: IngredientCategory) => {
    setEditingCategory(category);
    setCategoryForm({ 
      name: category.name, 
      image: undefined 
    });
    // Set preview to existing image URL if available
    if (category.imageUrl) {
      setCategoryImagePreview(category.imageUrl);
    }
    setShowCategoryModal(true);
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    setIsSubmitting(true);
    try {
      const token = authService.getStoredToken("admin");
      if (!token) throw new Error("No authentication token");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/ingredients/category/${categoryToDelete._id || categoryToDelete.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete category");
      }

      setShowDeleteCategoryModal(false);
      setCategoryToDelete(null);
      await loadData();
      alert("Category deleted successfully!");
    } catch (error: any) {
      console.error("Failed to delete category:", error);
      alert(error?.message || "Failed to delete category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleDiet = (dietId: string) => {
    const currentDiets = form.suitableDiets || [];
    if (currentDiets.includes(dietId)) {
      setForm({
        ...form,
        suitableDiets: currentDiets.filter(id => id !== dietId),
      });
    } else {
      setForm({
        ...form,
        suitableDiets: [...currentDiets, dietId],
      });
    }
  };

  const toggleParentIngredient = (ingredientId: string) => {
    const currentParents = form.parentIngredients || [];
    if (currentParents.includes(ingredientId)) {
      setForm({
        ...form,
        parentIngredients: currentParents.filter(id => id !== ingredientId),
      });
    } else {
      setForm({
        ...form,
        parentIngredients: [...currentParents, ingredientId],
      });
    }
  };

  const toggleHack = (hackId: string) => {
    const currentHacks = form.relatedHacks || [];
    if (currentHacks.includes(hackId)) {
      setForm({
        ...form,
        relatedHacks: currentHacks.filter(id => id !== hackId),
      });
    } else {
      setForm({
        ...form,
        relatedHacks: [...currentHacks, hackId],
      });
    }
  };

  const toggleMonth = (month: Month) => {
    const currentMonths = form.inSeason || [];
    if (currentMonths.includes(month)) {
      setForm({
        ...form,
        inSeason: currentMonths.filter(m => m !== month),
      });
    } else {
      setForm({
        ...form,
        inSeason: [...currentMonths, month],
      });
    }
  };

  const filteredIngredients = ingredients.filter(ingredient =>
    ingredient.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCategoryName = (categoryId: string | IngredientCategory): string => {
    if (typeof categoryId === "object") return categoryId.name;
    const cat = categories.find(c => c._id === categoryId || c.id === categoryId);
    return cat?.name || "Uncategorized";
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
        <div className="relative z-10 mx-auto max-w-7xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-gradient-to-br from-saveful-green to-saveful-green/70 p-4 shadow-xl">
                <FontAwesomeIcon icon={faLeaf} className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="mb-1 font-saveful-bold text-4xl text-saveful-green">
                  Ingredient Management
                </h1>
                <p className="font-saveful text-saveful-gray">
                  Manage ingredients with complete details
                </p>
              </div>
            </div>
          </motion.div>

          {/* Actions */}
          <div className="mb-6 flex flex-wrap gap-4">
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setEditingCategory(null);
                setCategoryForm({ name: "", image: undefined });
                setCategoryImagePreview(null);
                setShowCategoryModal(true);
              }}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-saveful-purple to-saveful-purple/80 px-6 py-3 font-saveful-semibold text-white shadow-lg transition-all hover:shadow-xl"
            >
              <FontAwesomeIcon icon={faPlus} />
              Add Category
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/admin/ingredients/new')}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-saveful-green to-saveful-green/80 px-6 py-3 font-saveful-semibold text-white shadow-lg transition-all hover:shadow-xl"
            >
              <FontAwesomeIcon icon={faPlus} />
              Add Ingredient
            </motion.button>
          </div>

          {/* Categories Management */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h3 className="mb-3 font-saveful-bold text-lg text-gray-800">Categories</h3>
            {loadingData ? (
              <div className="flex items-center gap-2 rounded-xl border-2 border-gray-200 bg-white p-4">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-saveful-purple border-t-transparent"></div>
                <span className="font-saveful text-sm text-gray-500">Loading categories...</span>
              </div>
            ) : categories.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center">
                <FontAwesomeIcon icon={faTag} className="mb-2 h-8 w-8 text-gray-400" />
                <p className="font-saveful text-sm text-gray-500">
                  No categories yet. Click "Add Category" to create one.
                </p>
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto rounded-xl border-2 border-gray-200 bg-white p-3">
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <div
                      key={category._id || category.id}
                      className="group relative flex items-center gap-2 rounded-lg border-2 border-gray-200 bg-gray-50 px-3 py-1.5 shadow-sm transition-all hover:border-saveful-purple hover:shadow-md"
                    >
                      <span className="font-saveful-semibold text-sm">{category.name}</span>
                      <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={() => handleEditCategory(category)}
                          className="rounded-md bg-blue-500 p-1.5 text-white hover:bg-blue-600"
                        >
                          <FontAwesomeIcon icon={faEdit} className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => {
                            setCategoryToDelete(category);
                            setShowDeleteCategoryModal(true);
                          }}
                          className="rounded-md bg-red-500 p-1.5 text-white hover:bg-red-600"
                        >
                          <FontAwesomeIcon icon={faTrash} className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="relative">
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ingredients..."
                className="w-full rounded-xl border-2 border-gray-200 bg-white py-3 pl-12 pr-4 font-saveful shadow-sm transition-all focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
              />
            </div>
          </motion.div>

          {/* Ingredients Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-2xl bg-white shadow-xl"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-saveful-green to-saveful-green/90">
                  <tr>
                    <th className="px-6 py-4 text-left font-saveful-bold text-sm text-white">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left font-saveful-bold text-sm text-white">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left font-saveful-bold text-sm text-white">
                      Weight (g)
                    </th>
                    <th className="px-6 py-4 text-left font-saveful-bold text-sm text-white">
                      Has Page
                    </th>
                    <th className="px-6 py-4 text-left font-saveful-bold text-sm text-white">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loadingData ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="h-12 w-12 animate-spin rounded-full border-4 border-saveful-green border-t-transparent"></div>
                          <div className="font-saveful text-saveful-gray">
                            Loading ingredients...
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : filteredIngredients.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center">
                        <div className="font-saveful text-saveful-gray">
                          No ingredients found
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredIngredients.map((ingredient, index) => (
                      <motion.tr
                        key={ingredient._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="transition-colors hover:bg-saveful-green/5"
                      >
                        <td className="px-6 py-4">
                          <div className="font-saveful-semibold text-saveful-black">
                            {ingredient.name}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex rounded-full bg-saveful-green/20 px-3 py-1.5 font-saveful-semibold text-xs text-saveful-green">
                            {getCategoryName(ingredient.categoryId)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-saveful text-sm text-gray-600">
                            {ingredient.averageWeight}g
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <FontAwesomeIcon
                            icon={ingredient.hasPage ? faToggleOn : faToggleOff}
                            className={`text-2xl ${
                              ingredient.hasPage ? "text-saveful-green" : "text-gray-300"
                            }`}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleEdit(ingredient)}
                              className="rounded-lg bg-blue-500 p-2.5 text-white shadow-md hover:bg-blue-600"
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => {
                                setIngredientToDelete(ingredient);
                                setShowDeleteModal(true);
                              }}
                              className="rounded-lg bg-red-500 p-2.5 text-white shadow-md hover:bg-red-600"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>

        {/* Ingredient Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm overflow-y-auto p-4"
              onClick={() => !isSubmitting && setShowModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="relative my-8 w-full max-w-5xl rounded-2xl bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white p-6 rounded-t-2xl">
                  <h2 className="font-saveful-bold text-2xl text-saveful-green">
                    {editingIngredient ? "Edit" : "Create"} Ingredient
                  </h2>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    disabled={isSubmitting}
                    className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </motion.button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="max-h-[calc(100vh-200px)] overflow-y-auto">
                  <div className="p-6 space-y-8">
                    {/* Basic Information Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 border-b-2 border-saveful-green/20 pb-2">
                        <div className="rounded-lg bg-saveful-green/10 p-2">
                          <FontAwesomeIcon icon={faLeaf} className="h-5 w-5 text-saveful-green" />
                        </div>
                        <h3 className="font-saveful-bold text-xl text-gray-800">
                          Basic Information
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="mb-2 block font-saveful-semibold text-sm text-gray-700">
                            Ingredient Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            required
                            placeholder="e.g., Tomato"
                            className="w-full rounded-lg border-2 border-gray-300 px-4 py-2.5 font-saveful transition-all focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block font-saveful-semibold text-sm text-gray-700">
                            Average Weight (Grams) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            min="1"
                            step="0.1"
                            value={form.averageWeight}
                            onChange={(e) => {
                              const val = e.target.value;
                              const num = Number(val);
                              setForm({ 
                                ...form, 
                                averageWeight: val === '' || isNaN(num) ? 1 : num 
                              });
                            }}
                            required
                            placeholder="e.g., 150"
                            className="w-full rounded-lg border-2 border-gray-300 px-4 py-2.5 font-saveful transition-all focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
                          />
                          <p className="mt-1 text-xs text-gray-500 font-saveful">
                            Must be greater than 0
                          </p>
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block font-saveful-semibold text-sm text-gray-700">
                          Ingredient Category <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={form.categoryId}
                          onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                          required
                          className="w-full rounded-lg border-2 border-gray-300 px-4 py-2.5 font-saveful transition-all focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
                        >
                          <option value="">
                            {loadingData ? "Loading categories..." : categories.length === 0 ? "No categories available - Add one first" : "Select category..."}
                          </option>
                          {categories.map((cat) => (
                            <option key={cat._id || cat.id} value={cat._id || cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                        {!loadingData && categories.length === 0 && (
                          <p className="mt-1 text-xs text-red-500 font-saveful">
                            Please create a category first before adding ingredients
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="mb-2 block font-saveful-semibold text-sm text-gray-700">
                          Suitable Diets <span className="text-red-500">*</span>
                        </label>
                        <div className="flex flex-wrap gap-2 rounded-lg border-2 border-gray-200 bg-gray-50 p-4">
                          {diets.length === 0 ? (
                            <p className="text-sm text-gray-500 font-saveful">Loading diets...</p>
                          ) : (
                            diets.map((diet) => {
                              const isSelected = (form.suitableDiets || []).includes(
                                diet._id || diet.id || ""
                              );
                              return (
                                <label
                                  key={diet._id || diet.id}
                                  className={`cursor-pointer rounded-full border-2 px-4 py-2 font-saveful-semibold text-sm transition-all ${
                                    isSelected
                                      ? "border-saveful-green bg-saveful-green text-white shadow-md"
                                      : "border-gray-300 bg-white text-gray-700 hover:border-saveful-green hover:bg-saveful-green/5"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleDiet(diet._id || diet.id || "")}
                                    className="sr-only"
                                  />
                                  {diet.name}
                                </label>
                              );
                            })
                          )}
                        </div>
                        <p className="mt-1 text-xs text-gray-500 font-saveful">
                          Select all diets that this ingredient is suitable for
                        </p>
                      </div>
                    </div>

                    {/* Has Page Toggle */}
                    <div className="rounded-xl border-2 border-gray-300 bg-gradient-to-r from-gray-50 to-white p-5">
                      <div className="flex items-start gap-4">
                        <input
                          type="checkbox"
                          id="hasPage"
                          checked={form.hasPage}
                          onChange={(e) => setForm({ ...form, hasPage: e.target.checked })}
                          className="mt-1 h-5 w-5 rounded border-gray-300 text-saveful-green focus:ring-saveful-green"
                        />
                        <div className="flex-1">
                          <label htmlFor="hasPage" className="font-saveful-bold text-base cursor-pointer text-gray-800">
                            Ingredient Has Dedicated Page
                          </label>
                          <p className="font-saveful text-sm text-gray-600 mt-1">
                            Enable this if the ingredient will have a dedicated page with additional content like images, descriptions, nutrition info, and related hacks.
                          </p>
                          {form.hasPage && (
                            <p className="mt-2 text-xs text-saveful-green font-saveful-semibold bg-saveful-green/10 rounded px-2 py-1 inline-block">
                              Additional fields are now required below
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Conditional Fields when hasPage is true */}
                    {form.hasPage && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-6 rounded-xl border-2 border-saveful-green/40 bg-gradient-to-br from-saveful-green/5 to-saveful-green/10 p-6"
                      >
                        <div className="flex items-center gap-3 border-b-2 border-saveful-green/20 pb-3">
                          <div className="rounded-lg bg-saveful-green/20 p-2">
                            <FontAwesomeIcon icon={faUpload} className="h-5 w-5 text-saveful-green" />
                          </div>
                          <h3 className="font-saveful-bold text-xl text-gray-800">
                            Page Content & Details
                          </h3>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Hero Image */}
                          <div className="lg:col-span-2">
                            <label className="mb-2 block font-saveful-semibold text-sm text-gray-700">
                              Hero Image
                            </label>
                            <div className="space-y-3">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                                id="hero-image-upload"
                              />
                              <label
                                htmlFor="hero-image-upload"
                                className="flex cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-dashed border-saveful-green/50 bg-white px-6 py-8 transition-all hover:border-saveful-green hover:bg-saveful-green/5"
                              >
                                <FontAwesomeIcon icon={faUpload} className="h-6 w-6 text-saveful-green" />
                                <div className="text-center">
                                  <span className="font-saveful-semibold text-sm text-gray-700">
                                    {heroImagePreview ? "Change Hero Image" : "Upload Hero Image"}
                                  </span>
                                  <p className="font-saveful text-xs text-gray-500 mt-1">
                                    PNG, JPG up to 10MB
                                  </p>
                                </div>
                              </label>
                              {heroImagePreview && (
                                <div className="relative h-48 w-full overflow-hidden rounded-xl border-2 border-gray-200">
                                  <Image
                                    src={heroImagePreview}
                                    alt="Hero preview"
                                    fill
                                    className="object-cover"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setHeroImageFile(null);
                                      setHeroImagePreview(null);
                                    }}
                                    className="absolute top-2 right-2 rounded-full bg-red-500 p-2 text-white shadow-lg hover:bg-red-600"
                                  >
                                    <FontAwesomeIcon icon={faTimes} className="h-4 w-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Theme */}
                          <div>
                            <label className="mb-2 block font-saveful-semibold text-sm text-gray-700">
                              Ingredient Theme <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={form.theme || ""}
                              onChange={(e) =>
                                setForm({ ...form, theme: e.target.value as IngredientTheme })
                              }
                              required={form.hasPage}
                              className="w-full rounded-lg border-2 border-gray-300 px-4 py-2.5 font-saveful transition-all focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
                            >
                              <option value="">Select theme...</option>
                              {THEMES.map((theme) => (
                                <option key={theme} value={theme}>
                                  {theme}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Order */}
                          <div>
                            <label className="mb-2 block font-saveful-semibold text-sm text-gray-700">
                              Display Order
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={form.order !== undefined ? form.order : ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setForm({ 
                                  ...form, 
                                  order: val === '' ? undefined : Number(val)
                                });
                              }}
                              placeholder="Optional"
                              className="w-full rounded-lg border-2 border-gray-300 px-4 py-2.5 font-saveful transition-all focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
                            />
                            <p className="mt-1 text-xs text-gray-500 font-saveful">
                              Lower numbers appear first (leave empty for default)
                            </p>
                          </div>

                          {/* Parent Ingredient */}
                          <div>
                            <label className="mb-2 block font-saveful-semibold text-sm text-gray-700">
                              Parent Ingredient
                            </label>
                            <select
                              value={(form.parentIngredients && form.parentIngredients.length > 0) ? form.parentIngredients[0] : ""}
                              onChange={(e) => {
                                const value = e.target.value;
                                setForm({
                                  ...form,
                                  parentIngredients: value ? [value] : [],
                                });
                              }}
                              className="w-full rounded-lg border-2 border-gray-300 px-4 py-2.5 font-saveful transition-all focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
                            >
                              <option value="">No parent ingredient</option>
                              {ingredients
                                .filter((ing) => ing._id !== editingIngredient?._id)
                                .map((ing) => (
                                  <option key={ing._id} value={ing._id}>
                                    {ing.name}
                                  </option>
                                ))}
                            </select>
                          </div>

                          {/* Sponsor */}
                          <div>
                            <label className="mb-2 block font-saveful-semibold text-sm text-gray-700">
                              Sponsor Panel
                            </label>
                            <select
                              value={form.sponsorId || ""}
                              onChange={(e) =>
                                setForm({ ...form, sponsorId: e.target.value || undefined })
                              }
                              className="w-full rounded-lg border-2 border-gray-300 px-4 py-2.5 font-saveful transition-all focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
                            >
                              <option value="">No sponsor</option>
                              {sponsors.map((sponsor) => (
                                <option key={sponsor._id} value={sponsor._id}>
                                  {sponsor.title}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Sticker */}
                          <div>
                            <label className="mb-2 block font-saveful-semibold text-sm text-gray-700">
                              Sticker
                            </label>
                            <select
                              value={form.stickerId || ""}
                              onChange={(e) =>
                                setForm({ ...form, stickerId: e.target.value || undefined })
                              }
                              className="w-full rounded-lg border-2 border-gray-300 px-4 py-2.5 font-saveful transition-all focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
                            >
                              <option value="">No sticker</option>
                              {stickers.map((sticker) => (
                                <option key={sticker.id} value={sticker.id}>
                                  {sticker.title}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Pantry Item Checkbox */}
                          <div className="lg:col-span-2">
                            <div className="flex items-center gap-3 rounded-lg border-2 border-gray-200 bg-white p-4">
                              <input
                                type="checkbox"
                                id="isPantryItem"
                                checked={form.isPantryItem || false}
                                onChange={(e) =>
                                  setForm({ ...form, isPantryItem: e.target.checked })
                                }
                                className="h-4 w-4 rounded border-gray-300 text-saveful-green"
                              />
                              <label htmlFor="isPantryItem" className="font-saveful-semibold text-sm cursor-pointer">
                                This is a pantry item
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        <div>
                          <label className="mb-2 block font-saveful-semibold text-sm text-gray-700">
                            Description
                          </label>
                          <RichTextEditor
                            value={form.description || ""}
                            onChange={(html) => setForm({ ...form, description: html })}
                            placeholder="Enter ingredient description..."
                          />
                        </div>

                        {/* Nutrition */}
                        <div>
                          <label className="mb-2 block font-saveful-semibold text-sm text-gray-700">
                            Nutrition Information
                          </label>
                          <RichTextEditor
                            value={form.nutrition || ""}
                            onChange={(html) => setForm({ ...form, nutrition: html })}
                            placeholder="Enter nutrition information..."
                          />
                        </div>

                        {/* Related Hacks */}
                        <div className="lg:col-span-2">
                          <label className="mb-2 block font-saveful-semibold text-sm text-gray-700">
                            Related Hacks & Tips
                          </label>
                          <div className="max-h-60 overflow-y-auto rounded-lg border-2 border-gray-200 bg-white p-4">
                            {hacks.length === 0 ? (
                              <p className="text-sm text-gray-500 font-saveful text-center py-4">
                                No hacks available
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {hacks.map((hack) => {
                                  const isSelected = (form.relatedHacks || []).includes(hack._id);
                                  return (
                                    <label
                                      key={hack._id}
                                      className={`flex items-start gap-3 cursor-pointer rounded-lg border-2 p-3 transition-all ${
                                        isSelected
                                          ? "border-saveful-green bg-saveful-green/10"
                                          : "border-gray-200 hover:border-saveful-green/50 hover:bg-gray-50"
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => toggleHack(hack._id)}
                                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-saveful-green focus:ring-saveful-green"
                                      />
                                      <div className="flex-1">
                                        <span className="font-saveful-semibold text-sm text-gray-800">
                                          {hack.title}
                                        </span>
                                        {hack.type && (
                                          <span className="ml-2 inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-saveful text-blue-700">
                                            {hack.type}
                                          </span>
                                        )}
                                      </div>
                                    </label>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-gray-500 font-saveful">
                            Select hacks and tips related to this ingredient
                          </p>
                        </div>

                        {/* In Season */}
                        <div>
                          <label className="mb-2 block font-saveful-semibold text-sm text-gray-700">
                            In Season Months <span className="text-red-500">*</span>
                          </label>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 rounded-lg border-2 border-gray-200 bg-white p-4">
                            {MONTHS.map((month) => {
                              const isSelected = (form.inSeason || []).includes(month);
                              return (
                                <label
                                  key={month}
                                  className={`cursor-pointer rounded-lg border-2 px-3 py-2 text-center font-saveful-semibold text-sm transition-all ${
                                    isSelected
                                      ? "border-saveful-green bg-saveful-green text-white shadow-md"
                                      : "border-gray-300 bg-gray-50 text-gray-700 hover:border-saveful-green hover:bg-saveful-green/5"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleMonth(month)}
                                    className="sr-only"
                                  />
                                  {month.substring(0, 3)}
                                </label>
                              );
                            })}
                          </div>
                          <p className="mt-1 text-xs text-gray-500 font-saveful">
                            Select all months when this ingredient is in season
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </form>

                {/* Footer */}
                <div className="sticky bottom-0 border-t-2 border-gray-200 bg-gradient-to-r from-white to-gray-50 p-6 rounded-b-2xl shadow-lg">
                  <div className="flex gap-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => {
                        if (isSubmitting) return;
                        const confirmClose = form.name || form.categoryId || heroImageFile
                          ? confirm("You have unsaved changes. Are you sure you want to close?")
                          : true;
                        if (confirmClose) {
                          setShowModal(false);
                          resetForm();
                        }
                      }}
                      disabled={isSubmitting}
                      className="flex-1 rounded-xl border-2 border-gray-300 bg-white py-3.5 font-saveful-semibold text-gray-700 transition-all hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      onClick={handleSubmit}
                      disabled={isSubmitting || !form.name || !form.categoryId || !form.suitableDiets?.length}
                      className="flex flex-1 items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-saveful-green to-saveful-green/90 py-3.5 font-saveful-bold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="h-5 w-5 animate-spin rounded-full border-3 border-white border-t-transparent"></div>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faSave} className="h-5 w-5" />
                          <span>{editingIngredient ? "Update Ingredient" : "Create Ingredient"}</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                  {!form.name || !form.categoryId || !form.suitableDiets?.length ? (
                    <p className="mt-3 text-center text-xs text-red-500 font-saveful">
                      Please fill in all required fields (*)
                    </p>
                  ) : null}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Modal */}
        <AnimatePresence>
          {showDeleteModal && ingredientToDelete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
              onClick={() => !isSubmitting && setShowDeleteModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="mb-4 font-saveful-bold text-xl text-red-600">
                  Delete Ingredient
                </h3>
                <p className="mb-6 font-saveful text-gray-700">
                  Are you sure you want to delete{" "}
                  <span className="font-saveful-semibold">{ingredientToDelete.name}</span>?
                  This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    disabled={isSubmitting}
                    className="flex-1 rounded-xl border-2 border-gray-200 py-2.5 font-saveful-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isSubmitting}
                    className="flex-1 rounded-xl bg-red-600 py-2.5 font-saveful-semibold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {isSubmitting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category Modal */}
        <AnimatePresence>
          {showCategoryModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
              onClick={() => !isSubmitting && setShowCategoryModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative p-6">
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-gradient-to-br from-saveful-purple/20 to-saveful-purple/10 p-3">
                        <FontAwesomeIcon icon={faTag} className="h-6 w-6 text-saveful-purple" />
                      </div>
                      <h2 className="font-saveful-bold text-2xl text-saveful-green">
                        {editingCategory ? "Edit" : "Create"} Category
                      </h2>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        setShowCategoryModal(false);
                        setEditingCategory(null);
                        setCategoryForm({ name: "", image: undefined });
                        setCategoryImagePreview(null);
                      }}
                      disabled={isSubmitting}
                      className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </motion.button>
                  </div>

                  <form onSubmit={handleCreateCategory} className="space-y-4">
                    <div>
                      <label className="mb-2 block font-saveful-semibold text-sm text-gray-700">
                        Name *
                      </label>
                      <input
                        type="text"
                        value={categoryForm.name}
                        onChange={(e) =>
                          setCategoryForm({ ...categoryForm, name: e.target.value })
                        }
                        required
                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 font-saveful transition-all focus:border-saveful-purple focus:outline-none focus:ring-2 focus:ring-saveful-purple/20"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block font-saveful-semibold text-sm text-gray-700">
                        Category Image
                      </label>
                      <div className="space-y-3">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCategoryImageUpload}
                          className="hidden"
                          id="category-image-upload"
                        />
                        <label
                          htmlFor="category-image-upload"
                          className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-6 transition-all hover:border-saveful-purple hover:bg-saveful-purple/5"
                        >
                          <FontAwesomeIcon icon={faUpload} className="text-saveful-purple" />
                          <span className="font-saveful text-sm text-gray-600">
                            {categoryImagePreview ? "Change Image" : "Upload Image"}
                          </span>
                        </label>
                        {categoryImagePreview && (
                          <div className="relative h-32 w-full overflow-hidden rounded-xl border-2 border-gray-200">
                            <Image
                              src={categoryImagePreview}
                              alt="Category preview"
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => {
                          setShowCategoryModal(false);
                          setEditingCategory(null);
                          setCategoryForm({ name: "", image: undefined });
                          setCategoryImagePreview(null);
                        }}
                        disabled={isSubmitting}
                        className="flex-1 rounded-xl border-2 border-gray-200 py-2.5 font-saveful-semibold text-gray-700 transition-all hover:bg-gray-50"
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 rounded-xl bg-gradient-to-r from-saveful-purple to-saveful-purple/80 py-2.5 font-saveful-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
                      >
                        {isSubmitting ? (editingCategory ? "Updating..." : "Creating...") : (editingCategory ? "Update" : "Create")}
                      </motion.button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Category Modal */}
        <AnimatePresence>
          {showDeleteCategoryModal && categoryToDelete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
              onClick={() => !isSubmitting && setShowDeleteCategoryModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="mb-4 font-saveful-bold text-xl text-red-600">
                  Delete Category
                </h3>
                <p className="mb-6 font-saveful text-gray-700">
                  Are you sure you want to delete{" "}
                  <span className="font-saveful-semibold">{categoryToDelete.name}</span>?
                  This action cannot be undone and may affect existing ingredients.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteCategoryModal(false)}
                    disabled={isSubmitting}
                    className="flex-1 rounded-xl border-2 border-gray-200 py-2.5 font-saveful-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteCategory}
                    disabled={isSubmitting}
                    className="flex-1 rounded-xl bg-red-600 py-2.5 font-saveful-semibold text-white hover:bg-red-700 disabled:opacity-50"
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
