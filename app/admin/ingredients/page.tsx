"use client";
import { useAuth, useCurrentUser } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import {
  ingredientManagementService,
  Ingredient,
  IngredientCategory,
  CreateIngredientDto,
} from "@/services/ingredientManagementService";
import { authService } from "@/services/authService";
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
  faTimes,
  faLeaf,
  faCheck,
  faUpload,
  faTag,
  faCalendar,
  faSave,
} from "@fortawesome/free-solid-svg-icons";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const THEMES = ["Green", "Red", "Yellow", "Blue", "Purple", "Orange"];

const SUITABLE_DIETS = [
  { key: "isVeg", label: "Veg" },
  { key: "isVegan", label: "Vegan" },
  { key: "isDairy", label: "Dairy" },
  { key: "isNut", label: "Nuts" },
  { key: "isGluten", label: "Gluten" },
];

export default function IngredientsPage() {
  const { isLoading } = useAuth("admin");
  const user = useCurrentUser("admin");
  const router = useRouter();

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [categories, setCategories] = useState<IngredientCategory[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showViewCategoriesModal, setShowViewCategoriesModal] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [editingCategory, setEditingCategory] = useState<IngredientCategory | null>(null);
  const [showDeleteCategoryModal, setShowDeleteCategoryModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<IngredientCategory | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [ingredientToDelete, setIngredientToDelete] = useState<Ingredient | null>(null);

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
  });

  const [ingredientForm, setIngredientForm] = useState<CreateIngredientDto>({
    name: "",
    aliases: [],
    description: "",
    nutritionInfo: "",
    categoryId: "",
    isVeg: false,
    isVegan: false,
    isDairy: false,
    isNut: false,
    isGluten: false,
    tags: [],
    hasPage: false,
    theme: "Green",
    inSeasonMonths: [],
    isPantryItem: false,
    averageWeight: undefined,
  });

  const [heroImagePreview, setHeroImagePreview] = useState<string | null>(null);
  const [aliasInput, setAliasInput] = useState("");
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    if (!isLoading && user) {
      loadData();
    }
  }, [isLoading, user]);

  const loadData = async () => {
    try {
      setLoadingData(true);
      const [ingredientsData, categoriesData] = await Promise.all([
        ingredientManagementService.getAllIngredients(),
        ingredientManagementService.getAllCategories(),
      ]);
      setIngredients(ingredientsData);
      setCategories(categoriesData);
    } catch (error: any) {
      console.error("Failed to load data:", error);
      alert("Failed to load data. Please refresh the page.");
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

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingCategory) {
        await ingredientManagementService.updateCategory(editingCategory.id, categoryForm);
        setEditingCategory(null);
      } else {
        await ingredientManagementService.createCategory(categoryForm);
      }
      setCategoryForm({ name: "", description: "" });
      setShowCategoryModal(false);
      await loadData();
    } catch (error: any) {
      console.error("Failed to save category:", error);
      alert(error?.response?.data?.message || "Failed to save category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCategory = (category: IngredientCategory) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || "",
    });
    setShowCategoryModal(true);
    setShowViewCategoriesModal(false);
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    setIsSubmitting(true);
    try {
      await ingredientManagementService.deleteCategory(categoryToDelete.id);
      setShowDeleteCategoryModal(false);
      setCategoryToDelete(null);
      await loadData();
    } catch (error: any) {
      console.error("Failed to delete category:", error);
      alert(error?.response?.data?.message || "Failed to delete category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const submissionData: CreateIngredientDto = {
        name: ingredientForm.name,
        aliases: ingredientForm.aliases || [],
        description: ingredientForm.description || "",
        nutritionInfo: ingredientForm.nutritionInfo || "",
        categoryId: ingredientForm.categoryId || "",
        tags: ingredientForm.tags || [],
        theme: ingredientForm.theme || "Green",
        inSeasonMonths: ingredientForm.inSeasonMonths || [],
        averageWeight: ingredientForm.averageWeight,
        heroImage: ingredientForm.heroImage,
        // Always send all boolean values explicitly
        isVeg: ingredientForm.isVeg === true,
        isVegan: ingredientForm.isVegan === true,
        isDairy: ingredientForm.isDairy === true,
        isNut: ingredientForm.isNut === true,
        isGluten: ingredientForm.isGluten === true,
        hasPage: ingredientForm.hasPage === true,
        isPantryItem: ingredientForm.isPantryItem === true,
      };

      console.log("Submitting ingredient:", submissionData);

      if (editingIngredient) {
        await ingredientManagementService.updateIngredient(
          editingIngredient.id,
          submissionData
        );
      } else {
        await ingredientManagementService.createIngredient(submissionData);
      }

      resetForm();
      setShowModal(false);
      await loadData();
    } catch (error: any) {
      console.error("Failed to save ingredient:", error);
      alert(error?.response?.data?.message || "Failed to save ingredient");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (ingredient: Ingredient) => {
    console.log("Editing ingredient:", ingredient);
    setEditingIngredient(ingredient);
    setIngredientForm({
      name: ingredient.name,
      aliases: ingredient.aliases || [],
      description: ingredient.description || "",
      nutritionInfo: ingredient.nutritionInfo || "",
      categoryId: ingredient.categoryId || "",
      isVeg: ingredient.isVeg === true,
      isVegan: ingredient.isVegan === true,
      isDairy: ingredient.isDairy === true,
      isNut: ingredient.isNut === true,
      isGluten: ingredient.isGluten === true,
      tags: ingredient.tags || [],
      hasPage: ingredient.hasPage === true,
      theme: ingredient.theme || "Green",
      inSeasonMonths: ingredient.inSeasonMonths || [],
      isPantryItem: ingredient.isPantryItem === true,
      averageWeight: ingredient.averageWeight ?? undefined,
    });
    if (ingredient.imageUrl) {
      setHeroImagePreview(ingredient.imageUrl);
    }
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!ingredientToDelete) return;

    setIsSubmitting(true);
    try {
      await ingredientManagementService.deleteIngredient(ingredientToDelete.id);
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
    setIngredientForm({
      name: "",
      aliases: [],
      description: "",
      nutritionInfo: "",
      categoryId: "",
      isVeg: false,
      isVegan: false,
      isDairy: false,
      isNut: false,
      isGluten: false,
      tags: [],
      hasPage: false,
      theme: "Green",
      inSeasonMonths: [],
      isPantryItem: false,
      averageWeight: undefined,
    });
    setHeroImagePreview(null);
    setAliasInput("");
    setTagInput("");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIngredientForm({ ...ingredientForm, heroImage: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setHeroImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addAlias = () => {
    if (aliasInput.trim()) {
      setIngredientForm({
        ...ingredientForm,
        aliases: [...(ingredientForm.aliases || []), aliasInput.trim()],
      });
      setAliasInput("");
    }
  };

  const removeAlias = (index: number) => {
    const newAliases = [...(ingredientForm.aliases || [])];
    newAliases.splice(index, 1);
    setIngredientForm({ ...ingredientForm, aliases: newAliases });
  };

  const addTag = () => {
    if (tagInput.trim()) {
      setIngredientForm({
        ...ingredientForm,
        tags: [...(ingredientForm.tags || []), tagInput.trim()],
      });
      setTagInput("");
    }
  };

  const removeTag = (index: number) => {
    const newTags = [...(ingredientForm.tags || [])];
    newTags.splice(index, 1);
    setIngredientForm({ ...ingredientForm, tags: newTags });
  };

  const toggleMonth = (month: string) => {
    const months = ingredientForm.inSeasonMonths || [];
    if (months.includes(month)) {
      setIngredientForm({
        ...ingredientForm,
        inSeasonMonths: months.filter((m) => m !== month),
      });
    } else {
      setIngredientForm({
        ...ingredientForm,
        inSeasonMonths: [...months, month],
      });
    }
  };

  const filteredIngredients = ingredients.filter((ingredient) =>
    ingredient.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // FIXED: Helper function to get active diet tags
  // The checkboxes represent what the ingredient CONTAINS or IS
  // Only show tags for TRUE values (checked checkboxes)
  const getActiveDietTags = (ingredient: Ingredient) => {
    const tags: string[] = [];
    
    // Show positive attributes (what it IS or CONTAINS)
    if (ingredient.isVeg) tags.push("Veg");
    if (ingredient.isVegan) tags.push("Vegan");
    if (ingredient.isDairy) tags.push("Contains Dairy");
    if (ingredient.isNut) tags.push("Contains Nuts");
    if (ingredient.isGluten) tags.push("Contains Gluten");
    
    return tags;
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
            src="/profile-green-apples.png"
            alt="Decoration"
            width={400}
            height={400}
            className="object-contain"
          />
        </div>
        <div className="pointer-events-none absolute bottom-0 left-0 opacity-10">
          <Image
            src="/Illustration@2x.png"
            alt="Illustration"
            width={300}
            height={300}
            className="object-contain"
          />
        </div>
        <div className="pointer-events-none absolute right-1/4 top-1/3 opacity-5">
          <Image
            src="/food.png"
            alt="Food"
            width={200}
            height={200}
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
                <FontAwesomeIcon icon={faLeaf} className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="mb-1 font-saveful-bold text-4xl text-saveful-green">
                  Ingredient Management
                </h1>
                <p className="font-saveful text-saveful-gray">
                  Manage ingredients and categories for the Saveful India platform
                </p>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <div className="mb-6 flex flex-wrap gap-4">
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCategoryModal(true)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-saveful-purple to-saveful-purple/80 px-6 py-3 font-saveful-semibold text-white shadow-lg transition-all hover:shadow-xl"
            >
              <FontAwesomeIcon icon={faPlus} />
              Add Category
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowViewCategoriesModal(true)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-saveful-orange to-saveful-orange/80 px-6 py-3 font-saveful-semibold text-white shadow-lg transition-all hover:shadow-xl"
            >
              <FontAwesomeIcon icon={faSearch} />
              View Categories ({categories.length})
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-saveful-green to-saveful-green/80 px-6 py-3 font-saveful-semibold text-white shadow-lg transition-all hover:shadow-xl"
            >
              <FontAwesomeIcon icon={faPlus} />
              Add Ingredient
            </motion.button>
          </div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="relative group">
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-hover:text-saveful-green"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ingredients..."
                className="w-full rounded-xl border-2 border-gray-200 bg-white py-3 pl-12 pr-4 font-saveful shadow-sm transition-all focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20 focus:shadow-md"
              />
            </div>
          </motion.div>

          {/* Ingredients Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative overflow-hidden rounded-2xl bg-white shadow-xl backdrop-blur-sm transition-all hover:shadow-2xl"
          >
            {/* Background Pattern */}
            <div className="pointer-events-none absolute bottom-0 right-0 opacity-5">
              <Image
                src="/profile-pink-limes.png"
                alt=""
                width={200}
                height={200}
                className="object-contain"
              />
            </div>

            <div className="relative overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-saveful-green via-saveful-green/90 to-saveful-green">
                  <tr>
                    <th className="px-6 py-4 text-left font-saveful-bold text-sm text-white">
                      Image
                    </th>
                    <th className="px-6 py-4 text-left font-saveful-bold text-sm text-white">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left font-saveful-bold text-sm text-white">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left font-saveful-bold text-sm text-white">
                      Diets
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
                        <div className="flex flex-col items-center gap-3">
                          <div className="rounded-full bg-gray-100 p-6">
                            <FontAwesomeIcon
                              icon={faLeaf}
                              className="h-12 w-12 text-gray-300"
                            />
                          </div>
                          <div className="font-saveful text-saveful-gray">
                            No ingredients found
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredIngredients.map((ingredient, index) => (
                      <motion.tr
                        key={ingredient.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group transition-colors hover:bg-gradient-to-r hover:from-saveful-green/5 hover:to-transparent"
                      >
                        <td className="px-6 py-4">
                          {ingredient.imageUrl ? (
                            <div className="relative h-14 w-14 overflow-hidden rounded-xl shadow-md transition-transform group-hover:scale-110">
                              <Image
                                src={ingredient.imageUrl}
                                alt={ingredient.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 shadow-sm transition-transform group-hover:scale-110">
                              <FontAwesomeIcon
                                icon={faLeaf}
                                className="text-xl text-gray-400"
                              />
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-saveful-semibold text-saveful-black">
                            {ingredient.name}
                          </div>
                          {ingredient.aliases && ingredient.aliases.length > 0 && (
                            <div className="mt-1 font-saveful text-xs text-gray-500 truncate max-w-xs">
                              {ingredient.aliases.join(", ")}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex rounded-full bg-gradient-to-r from-saveful-green/20 to-saveful-green/10 px-3 py-1.5 font-saveful-semibold text-xs text-saveful-green shadow-sm">
                            {ingredient.category?.name || "Uncategorized"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            {getActiveDietTags(ingredient).length > 0 ? (
                              getActiveDietTags(ingredient).map((tag) => (
                                <span
                                  key={tag}
                                  className="rounded-full bg-green-100 px-2.5 py-1 font-saveful-semibold text-xs text-green-700 shadow-sm whitespace-nowrap"
                                >
                                  {tag}
                                </span>
                              ))
                            ) : (
                              <span className="rounded-full bg-gray-100 px-2.5 py-1 font-saveful-semibold text-xs text-gray-500 shadow-sm">
                                No tags
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleEdit(ingredient)}
                              className="rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 p-2.5 text-white shadow-md transition-all hover:shadow-lg"
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
                              className="rounded-lg bg-gradient-to-r from-red-500 to-red-600 p-2.5 text-white shadow-md transition-all hover:shadow-lg"
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
                <div className="pointer-events-none absolute right-0 top-0 opacity-5">
                  <Image
                    src="/profile-green-apples.png"
                    alt=""
                    width={150}
                    height={150}
                    className="object-contain"
                  />
                </div>

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
                        setCategoryForm({ name: "", description: "" });
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
                        Description
                      </label>
                      <textarea
                        value={categoryForm.description}
                        onChange={(e) =>
                          setCategoryForm({
                            ...categoryForm,
                            description: e.target.value,
                          })
                        }
                        rows={3}
                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 font-saveful transition-all focus:border-saveful-purple focus:outline-none focus:ring-2 focus:ring-saveful-purple/20"
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => {
                          setShowCategoryModal(false);
                          setEditingCategory(null);
                          setCategoryForm({ name: "", description: "" });
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
                        {isSubmitting
                          ? editingCategory
                            ? "Updating..."
                            : "Creating..."
                          : editingCategory
                            ? "Update"
                            : "Create"}
                      </motion.button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ingredient Modal - FIXED VERSION */}
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
                className="relative my-8 w-full max-w-4xl rounded-2xl bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Fixed Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white p-6 rounded-t-2xl">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-gradient-to-br from-saveful-green/20 to-saveful-green/10 p-3">
                      <FontAwesomeIcon icon={faLeaf} className="h-6 w-6 text-saveful-green" />
                    </div>
                    <h2 className="font-saveful-bold text-2xl text-saveful-green">
                      {editingIngredient ? "Edit" : "Create"} Ingredient
                    </h2>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    disabled={isSubmitting}
                    className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </motion.button>
                </div>

                {/* Scrollable Content */}
                <div className="max-h-[70vh] overflow-y-auto p-6">
                  <form onSubmit={handleSubmitIngredient} className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block font-saveful-semibold text-sm text-gray-700">
                          Name *
                        </label>
                        <input
                          type="text"
                          value={ingredientForm.name}
                          onChange={(e) =>
                            setIngredientForm({
                              ...ingredientForm,
                              name: e.target.value,
                            })
                          }
                          required
                          className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 font-saveful transition-all focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block font-saveful-semibold text-sm text-gray-700">
                          Average Weight (Grams)
                        </label>
                        <input
                          type="number"
                          value={ingredientForm.averageWeight ?? ""}
                          onChange={(e) =>
                            setIngredientForm({
                              ...ingredientForm,
                              averageWeight:
                                e.target.value === ""
                                  ? undefined
                                  : Number(e.target.value),
                            })
                          }
                          className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 font-saveful transition-all focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
                        />
                      </div>
                    </div>

                    {/* Category */}
                    <div>
                      <label className="mb-2 block font-saveful-semibold text-sm text-gray-700">
                        Ingredient Category *
                      </label>
                      <select
                        value={ingredientForm.categoryId}
                        onChange={(e) =>
                          setIngredientForm({
                            ...ingredientForm,
                            categoryId: e.target.value,
                          })
                        }
                        required
                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 font-saveful transition-all focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
                      >
                        <option value="">Select category...</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Suitable Diets - FIXED */}
                    <div>
                      <label className="mb-3 block font-saveful-semibold text-sm text-gray-700">
                        Suitable Diets *
                      </label>
                      <div className="flex flex-wrap gap-3">
                        {SUITABLE_DIETS.map((diet) => {
                          const isChecked =
                            ingredientForm[
                              diet.key as keyof CreateIngredientDto
                            ] === true;
                          return (
                            <label
                              key={diet.key}
                              className={`group flex items-center gap-2 rounded-xl border-2 px-4 py-3 cursor-pointer transition-all hover:border-saveful-green hover:shadow-md ${
                                isChecked
                                  ? "border-saveful-green bg-saveful-green/10"
                                  : "border-gray-200 bg-gradient-to-r from-gray-50 to-white"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  setIngredientForm((prev) => ({
                                    ...prev,
                                    [diet.key]: e.target.checked,
                                  }));
                                }}
                                className="h-5 w-5 rounded border-gray-300 text-saveful-green transition-all focus:ring-2 focus:ring-saveful-green"
                              />
                              <span
                                className={`font-saveful-semibold text-sm transition-colors ${
                                  isChecked
                                    ? "text-saveful-green"
                                    : "text-gray-700 group-hover:text-saveful-green"
                                }`}
                              >
                                {diet.label}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Has Page Toggle */}
                    <div
                      className={`flex items-center gap-3 rounded-xl border-2 p-4 transition-all hover:shadow-md ${
                        ingredientForm.hasPage
                          ? "border-saveful-green bg-saveful-green/5"
                          : "border-gray-200 bg-gradient-to-r from-gray-50 to-transparent"
                      }`}
                    >
                      <input
                        type="checkbox"
                        id="hasPage"
                        checked={ingredientForm.hasPage === true}
                        onChange={(e) =>
                          setIngredientForm({
                            ...ingredientForm,
                            hasPage: e.target.checked,
                          })
                        }
                        className="h-6 w-6 rounded border-gray-300 text-saveful-green transition-all focus:ring-2 focus:ring-saveful-green"
                      />
                      <label
                        htmlFor="hasPage"
                        className="font-saveful-semibold text-sm text-gray-700 cursor-pointer"
                      >
                        Ingredient has page
                      </label>
                    </div>

                    {/* Conditional Fields */}
                    {ingredientForm.hasPage && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-6 rounded-lg border-2 border-saveful-green/20 bg-saveful-green/5 p-6"
                      >
                        {/* Hero Image */}
                        <div>
                          <label className="mb-2 block font-saveful-semibold text-sm text-gray-700">
                            Hero Image *
                          </label>
                          <div className="flex items-center gap-4">
                            <label className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-3 transition-colors hover:border-saveful-green hover:bg-saveful-green/5">
                              <FontAwesomeIcon
                                icon={faUpload}
                                className="text-gray-400"
                              />
                              <span className="font-saveful text-sm text-gray-600">
                                Upload Image
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                              />
                            </label>
                            {heroImagePreview && (
                              <div className="relative h-20 w-20 overflow-hidden rounded-lg">
                                <Image
                                  src={heroImagePreview}
                                  alt="Preview"
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Theme */}
                        <div>
                          <label className="mb-2 block font-saveful-semibold text-sm text-gray-700">
                            Ingredient Theme *
                          </label>
                          <select
                            value={ingredientForm.theme}
                            onChange={(e) =>
                              setIngredientForm({
                                ...ingredientForm,
                                theme: e.target.value,
                              })
                            }
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 font-saveful focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
                          >
                            {THEMES.map((theme) => (
                              <option key={theme} value={theme}>
                                {theme}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Aliases */}
                        <div>
                          <label className="mb-2 block font-saveful-semibold text-sm text-gray-700">
                            Aliases
                          </label>
                          <div className="space-y-3">
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={aliasInput}
                                onChange={(e) => setAliasInput(e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    addAlias();
                                  }
                                }}
                                placeholder="Add an alias..."
                                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-saveful focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
                              />
                              <button
                                type="button"
                                onClick={addAlias}
                                className="rounded-lg bg-saveful-green px-4 py-2 font-saveful-semibold text-white hover:bg-saveful-green/90"
                              >
                                <FontAwesomeIcon icon={faPlus} />
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {(ingredientForm.aliases || []).map(
                                (alias, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center gap-1 rounded-full bg-saveful-green/20 px-3 py-1 text-sm font-saveful text-saveful-green"
                                  >
                                    {alias}
                                    <button
                                      type="button"
                                      onClick={() => removeAlias(index)}
                                      className="ml-1 hover:text-red-600"
                                    >
                                      <FontAwesomeIcon
                                        icon={faTimes}
                                        className="h-3 w-3"
                                      />
                                    </button>
                                  </span>
                                ),
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Tags */}
                        <div>
                          <label className="mb-2 block font-saveful-semibold text-sm text-gray-700">
                            Tags
                          </label>
                          <div className="space-y-3">
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    addTag();
                                  }
                                }}
                                placeholder="Add a tag..."
                                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-saveful focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
                              />
                              <button
                                type="button"
                                onClick={addTag}
                                className="rounded-lg bg-saveful-green px-4 py-2 font-saveful-semibold text-white hover:bg-saveful-green/90"
                              >
                                <FontAwesomeIcon icon={faTag} />
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {(ingredientForm.tags || []).map((tag, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center gap-1 rounded-full bg-saveful-purple/20 px-3 py-1 text-sm font-saveful text-saveful-purple"
                                >
                                  {tag}
                                  <button
                                    type="button"
                                    onClick={() => removeTag(index)}
                                    className="ml-1 hover:text-red-600"
                                  >
                                    <FontAwesomeIcon
                                      icon={faTimes}
                                      className="h-3 w-3"
                                    />
                                  </button>
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        <div>
                          <label className="mb-2 block font-saveful-semibold text-sm text-gray-700">
                            Description *
                          </label>
                          <textarea
                            value={ingredientForm.description}
                            onChange={(e) =>
                              setIngredientForm({
                                ...ingredientForm,
                                description: e.target.value,
                              })
                            }
                            rows={4}
                            placeholder="Sage is an aromatic herb that belongs to the mint family..."
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 font-saveful focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
                          />
                        </div>

                        {/* Nutrition */}
                        <div>
                          <label className="mb-2 block font-saveful-semibold text-sm text-gray-700">
                            Nutrition *
                          </label>
                          <textarea
                            value={ingredientForm.nutritionInfo}
                            onChange={(e) =>
                              setIngredientForm({
                                ...ingredientForm,
                                nutritionInfo: e.target.value,
                              })
                            }
                            rows={4}
                            placeholder="Sage contains various compounds, including essential oils and antioxidants..."
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 font-saveful focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
                          />
                        </div>

                        {/* In Season */}
                        <div>
                          <label className="mb-3 block font-saveful-semibold text-sm text-gray-700">
                            In Season *
                          </label>
                          <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
                            {MONTHS.map((month) => {
                              const isSelected =
                                ingredientForm.inSeasonMonths?.includes(month);
                              return (
                                <label
                                  key={month}
                                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer transition-all ${
                                    isSelected
                                      ? "border-saveful-green bg-saveful-green/10"
                                      : "border-gray-200 bg-white hover:bg-gray-50"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleMonth(month)}
                                    className="h-4 w-4 rounded border-gray-300 text-saveful-green focus:ring-saveful-green"
                                  />
                                  <span
                                    className={`font-saveful text-sm ${
                                      isSelected
                                        ? "text-saveful-green font-semibold"
                                        : "text-gray-700"
                                    }`}
                                  >
                                    {month}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </div>

                        {/* Pantry Item */}
                        <div
                          className={`flex items-center gap-3 rounded-lg border-2 p-3 ${
                            ingredientForm.isPantryItem
                              ? "border-saveful-green bg-saveful-green/10"
                              : "border-gray-200"
                          }`}
                        >
                          <input
                            type="checkbox"
                            id="isPantryItem"
                            checked={ingredientForm.isPantryItem === true}
                            onChange={(e) =>
                              setIngredientForm({
                                ...ingredientForm,
                                isPantryItem: e.target.checked,
                              })
                            }
                            className="h-4 w-4 rounded border-gray-300 text-saveful-green focus:ring-saveful-green"
                          />
                          <label
                            htmlFor="isPantryItem"
                            className="font-saveful text-sm text-gray-700 cursor-pointer"
                          >
                            Pantry Item
                          </label>
                        </div>
                      </motion.div>
                    )}
                  </form>
                </div>

                {/* Fixed Footer */}
                <div className="sticky bottom-0 border-t border-gray-200 bg-white p-6 rounded-b-2xl">
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        resetForm();
                      }}
                      disabled={isSubmitting}
                      className="flex-1 rounded-xl border-2 border-gray-200 py-3 font-saveful-semibold text-gray-700 transition-all hover:bg-gray-50"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      onClick={handleSubmitIngredient}
                      disabled={isSubmitting}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-saveful-green to-saveful-green/80 py-3 font-saveful-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
                    >
                      <FontAwesomeIcon icon={faSave} />
                      {isSubmitting
                        ? "Saving..."
                        : editingIngredient
                          ? "Update"
                          : "Create"}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Category Confirmation Modal */}
        <AnimatePresence>
          {showDeleteCategoryModal && categoryToDelete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
              onClick={() => !isSubmitting && setShowDeleteCategoryModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-xl bg-gradient-to-br from-red-500/20 to-red-500/10 p-3">
                      <FontAwesomeIcon
                        icon={faTrash}
                        className="h-6 w-6 text-red-600"
                      />
                    </div>
                    <h3 className="font-saveful-bold text-xl text-red-600">
                      Delete Category
                    </h3>
                  </div>
                  <p className="mb-6 font-saveful text-gray-700">
                    Are you sure you want to delete{" "}
                    <span className="font-saveful-semibold text-saveful-black">
                      {categoryToDelete.name}
                    </span>
                    ? This action cannot be undone and will affect all ingredients
                    in this category.
                  </p>
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowDeleteCategoryModal(false)}
                      disabled={isSubmitting}
                      className="flex-1 rounded-xl border-2 border-gray-200 py-2.5 font-saveful-semibold text-gray-700 transition-all hover:bg-gray-50"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleDeleteCategory}
                      disabled={isSubmitting}
                      className="flex-1 rounded-xl bg-gradient-to-r from-red-600 to-red-500 py-2.5 font-saveful-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
                    >
                      {isSubmitting ? "Deleting..." : "Delete"}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Ingredient Confirmation Modal */}
        <AnimatePresence>
          {showDeleteModal && ingredientToDelete && (
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
                className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="pointer-events-none absolute right-0 top-0 opacity-5">
                  <Image
                    src="/eggplant-survey.png"
                    alt=""
                    width={150}
                    height={150}
                    className="object-contain"
                  />
                </div>

                <div className="relative p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-xl bg-gradient-to-br from-red-500/20 to-red-500/10 p-3">
                      <FontAwesomeIcon
                        icon={faTrash}
                        className="h-6 w-6 text-red-600"
                      />
                    </div>
                    <h3 className="font-saveful-bold text-xl text-red-600">
                      Delete Ingredient
                    </h3>
                  </div>
                  <p className="mb-6 font-saveful text-gray-700">
                    Are you sure you want to delete{" "}
                    <span className="font-saveful-semibold text-saveful-black">
                      {ingredientToDelete.name}
                    </span>
                    ? This action cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowDeleteModal(false)}
                      disabled={isSubmitting}
                      className="flex-1 rounded-xl border-2 border-gray-200 py-2.5 font-saveful-semibold text-gray-700 transition-all hover:bg-gray-50"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleDelete}
                      disabled={isSubmitting}
                      className="flex-1 rounded-xl bg-gradient-to-r from-red-600 to-red-500 py-2.5 font-saveful-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
                    >
                      {isSubmitting ? "Deleting..." : "Delete"}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* View Categories Modal */}
        <AnimatePresence>
          {showViewCategoriesModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
              onClick={() => setShowViewCategoriesModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="sticky top-0 z-10 border-b border-gray-200 bg-gradient-to-r from-saveful-purple to-saveful-purple/90 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                        <FontAwesomeIcon
                          icon={faSearch}
                          className="h-5 w-5 text-white"
                        />
                      </div>
                      <h3 className="font-saveful-bold text-2xl text-white">
                        All Categories ({categories.length})
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setShowViewCategoriesModal(false);
                          setShowCategoryModal(true);
                        }}
                        className="rounded-lg bg-white/20 px-4 py-2 font-saveful-semibold text-sm text-white transition-colors hover:bg-white/30"
                      >
                        <FontAwesomeIcon icon={faPlus} className="mr-2" />
                        Add Category
                      </button>
                      <button
                        onClick={() => setShowViewCategoriesModal(false)}
                        className="rounded-lg p-2 text-white transition-colors hover:bg-white/20"
                      >
                        <FontAwesomeIcon icon={faTimes} className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Scrollable Content */}
                <div className="max-h-[60vh] overflow-y-auto p-6">
                  {categories.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-12">
                      <div className="rounded-full bg-gray-100 p-6">
                        <FontAwesomeIcon
                          icon={faLeaf}
                          className="h-12 w-12 text-gray-300"
                        />
                      </div>
                      <div className="font-saveful text-gray-500">
                        No categories found
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {categories.map((category, index) => (
                        <motion.div
                          key={category.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="group rounded-xl bg-gradient-to-br from-saveful-purple/10 to-saveful-purple/5 p-4 shadow-sm transition-all hover:shadow-md"
                        >
                          <div className="mb-2 flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-saveful-bold text-lg text-saveful-purple">
                                {category.name}
                              </div>
                              <div className="rounded-full bg-saveful-purple/20 px-2.5 py-0.5 font-saveful-semibold text-xs text-saveful-purple inline-block mt-1">
                                #{index + 1}
                              </div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleEditCategory(category)}
                                className="rounded-lg p-2 text-saveful-green hover:bg-saveful-green/10 transition-colors"
                                title="Edit category"
                              >
                                <FontAwesomeIcon
                                  icon={faEdit}
                                  className="h-4 w-4"
                                />
                              </button>
                              <button
                                onClick={() => {
                                  setCategoryToDelete(category);
                                  setShowDeleteCategoryModal(true);
                                }}
                                className="rounded-lg p-2 text-red-500 hover:bg-red-50 transition-colors"
                                title="Delete category"
                              >
                                <FontAwesomeIcon
                                  icon={faTrash}
                                  className="h-4 w-4"
                                />
                              </button>
                            </div>
                          </div>
                          {category.description && (
                            <div className="font-saveful text-sm text-gray-600 mb-2">
                              {category.description}
                            </div>
                          )}
                          <div className="flex items-center gap-2 font-saveful text-xs text-gray-500">
                            <FontAwesomeIcon
                              icon={faCalendar}
                              className="h-3 w-3"
                            />
                            Created:{" "}
                            {new Date(category.createdAt).toLocaleDateString()}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
} 