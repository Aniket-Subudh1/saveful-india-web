"use client";
import { useAuth, useCurrentUser } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import {
  hackManagementService,
  Hack,
  HackCategory,
  CreateHackDto,
  ArticleBlock,
  ArticleBlockType,
  TextBlock,
  ListBlock,
  AccordionBlock,
  ImageBlock,
  VideoBlock,
  ImageDetailsBlock,
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
  faTimes,
  faSave,
  faUpload,
  faFileAlt,
  faImage,
  faVideo,
  faList,
  faChevronDown,
  faInfoCircle,
  faArrowUp,
  faArrowDown,
  faLightbulb,
} from "@fortawesome/free-solid-svg-icons";
import { RichTextEditor } from "@/components/ui/RichTextEditor";

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
  const [showHackModal, setShowHackModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteCategoryModal, setShowDeleteCategoryModal] = useState(false);
  const [editingHack, setEditingHack] = useState<Hack | null>(null);
  const [hackToDelete, setHackToDelete] = useState<Hack | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<HackCategory | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    heroImage: null as File | null,
    iconImage: null as File | null,
  });

  const [hackForm, setHackForm] = useState<CreateHackDto>({
    title: "",
    shortDescription: "",
    description: "",
    leadText: "",
    categoryId: "",
    sponsorId: "",
    articleBlocks: [],
  });

  const [hackImages, setHackImages] = useState<{
    thumbnailImage: File | null;
    heroImage: File | null;
  }>({
    thumbnailImage: null,
    heroImage: null,
  });

  const [imagePreviews, setImagePreviews] = useState<{
    thumbnail: string | null;
    hero: string | null;
    categoryHero: string | null;
    categoryIcon: string | null;
  }>({
    thumbnail: null,
    hero: null,
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
      const [categoriesData, sponsorsData] = await Promise.all([
        hackManagementService.getAllCategories(),
        sponsorManagementService.getAllSponsors(),
      ]);
      setCategories(categoriesData);
      setSponsors(sponsorsData);
      if (categoriesData.length > 0 && !selectedCategory) {
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
      const data = await hackManagementService.getHacksByCategory(categoryId);
      // The API returns { response: { category, hacks } }
      const hacksArray = data.response?.hacks || [];
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

  const handleCreateHack = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await hackManagementService.createHack(hackForm, {
        thumbnailImage: hackImages.thumbnailImage || undefined,
        heroImage: hackImages.heroImage || undefined,
      });

      alert("Hack created successfully!");
      resetHackForm();
      setShowHackModal(false);
      if (selectedCategory) {
        fetchHacksByCategory(selectedCategory);
      }
    } catch (error: any) {
      console.error("Error creating hack:", error);
      alert(error?.response?.data?.message || "Failed to create hack");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateHack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHack) return;

    setIsSubmitting(true);
    try {
      await hackManagementService.updateHack(editingHack._id, hackForm, {
        thumbnailImage: hackImages.thumbnailImage || undefined,
        heroImage: hackImages.heroImage || undefined,
      });

      alert("Hack updated successfully!");
      resetHackForm();
      setShowHackModal(false);
      setEditingHack(null);
      if (selectedCategory) {
        fetchHacksByCategory(selectedCategory);
      }
    } catch (error: any) {
      console.error("Error updating hack:", error);
      alert(error?.response?.data?.message || "Failed to update hack");
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
      alert(error?.response?.data?.message || "Failed to delete category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetHackForm = () => {
    setHackForm({
      title: "",
      shortDescription: "",
      description: "",
      leadText: "",
      categoryId: selectedCategory || "",
      sponsorId: "",
      articleBlocks: [],
    });
    setHackImages({
      thumbnailImage: null,
      heroImage: null,
    });
    setImagePreviews((prev) => ({
      ...prev,
      thumbnail: null,
      hero: null,
    }));
  };

  const openEditModal = (hack: Hack) => {
    setEditingHack(hack);
    setHackForm({
      title: hack.title,
      shortDescription: hack.shortDescription || "",
      description: hack.description || "",
      leadText: hack.leadText || "",
      categoryId: hack.categoryId,
      sponsorId: hack.sponsorId || "",
      articleBlocks: hack.articleBlocks,
    });
    setShowHackModal(true);
  };

  const openCreateModal = () => {
    setEditingHack(null);
    resetHackForm();
    setHackForm((prev) => ({ ...prev, categoryId: selectedCategory || "" }));
    setShowHackModal(true);
  };

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "categoryHero" | "categoryIcon" | "thumbnail" | "hero" | "icon"
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
      } else {
        setHackImages((prev) => ({
          ...prev,
          [`${type}Image`]: file,
        }));
      }
    }
  };

  // Article block management
  const addBlock = (type: ArticleBlockType) => {
    const newBlock: Partial<ArticleBlock> = {
      type,
      id: `block-${Date.now()}`,
    };

    switch (type) {
      case ArticleBlockType.TEXT:
        (newBlock as TextBlock).text = "";
        break;
      case ArticleBlockType.IMAGE:
        (newBlock as ImageBlock).imageUrl = "";
        break;
      case ArticleBlockType.VIDEO:
        (newBlock as VideoBlock).videoUrl = "";
        break;
      case ArticleBlockType.LIST:
        (newBlock as ListBlock).listTitle = "";
        (newBlock as ListBlock).listItems = [];
        break;
      case ArticleBlockType.ACCORDION:
        (newBlock as AccordionBlock).accordion = [];
        break;
      case ArticleBlockType.IMAGE_DETAILS:
        (newBlock as ImageDetailsBlock).blockImageUrl = "";
        (newBlock as ImageDetailsBlock).blockTitle = "";
        (newBlock as ImageDetailsBlock).blockDescription = "";
        break;
    }

    setHackForm((prev) => ({
      ...prev,
      articleBlocks: [...prev.articleBlocks, newBlock as ArticleBlock],
    }));
  };

  const updateBlock = (index: number, updates: Partial<ArticleBlock>) => {
    setHackForm((prev) => ({
      ...prev,
      articleBlocks: prev.articleBlocks.map((block, i) =>
        i === index ? { ...block, ...updates } : block
      ) as ArticleBlock[],
    }));
  };

  const removeBlock = (index: number) => {
    setHackForm((prev) => ({
      ...prev,
      articleBlocks: prev.articleBlocks.filter((_, i) => i !== index),
    }));
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= hackForm.articleBlocks.length) return;

    setHackForm((prev) => {
      const newBlocks = [...prev.articleBlocks];
      [newBlocks[index], newBlocks[newIndex]] = [
        newBlocks[newIndex],
        newBlocks[index],
      ];
      return { ...prev, articleBlocks: newBlocks };
    });
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
                onClick={openCreateModal}
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
                        onClick={() => openEditModal(hack)}
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
            onClick={() => setShowCategoryModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="w-full max-w-md rounded-lg bg-white p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="mb-4 text-xl font-bold">Create Category</h2>
              <form onSubmit={handleCreateCategory} className="space-y-4">
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
                    Hero Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    required
                    onChange={(e) => handleImageChange(e, "categoryHero")}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                  {imagePreviews.categoryHero && (
                    <div className="relative mt-2 h-32 w-full">
                      <Image
                        src={imagePreviews.categoryHero}
                        alt="Hero Preview"
                        fill
                        className="rounded-lg object-cover"
                      />
                    </div>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Icon Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    required
                    onChange={(e) => handleImageChange(e, "categoryIcon")}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                  {imagePreviews.categoryIcon && (
                    <div className="relative mt-2 h-32 w-full">
                      <Image
                        src={imagePreviews.categoryIcon}
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
                    onClick={() => setShowCategoryModal(false)}
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 rounded-lg bg-saveful-green px-4 py-2 text-white hover:bg-green-600 disabled:bg-gray-300"
                  >
                    {isSubmitting ? "Creating..." : "Create"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hack Modal - Continued in next part due to length */}
      <HackModal
        show={showHackModal}
        onClose={() => {
          setShowHackModal(false);
          setEditingHack(null);
          resetHackForm();
        }}
        isEditing={!!editingHack}
        hackForm={hackForm}
        setHackForm={setHackForm}
        imagePreviews={imagePreviews}
        handleImageChange={handleImageChange}
        addBlock={addBlock}
        updateBlock={updateBlock}
        removeBlock={removeBlock}
        moveBlock={moveBlock}
        onSubmit={editingHack ? handleUpdateHack : handleCreateHack}
        isSubmitting={isSubmitting}
        categories={categories}
        sponsors={sponsors}
      />

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

// Separate component for Hack Modal due to size
function HackModal({
  show,
  onClose,
  isEditing,
  hackForm,
  setHackForm,
  imagePreviews,
  handleImageChange,
  addBlock,
  updateBlock,
  removeBlock,
  moveBlock,
  onSubmit,
  isSubmitting,
  categories,
  sponsors,
}: any) {
  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        className="my-8 w-full max-w-4xl rounded-lg bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-xl font-bold">
          {isEditing ? "Edit Hack" : "Create Hack"}
        </h2>
        <form onSubmit={onSubmit} className="space-y-6 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
          {/* Basic Fields */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Title *</label>
              <input
                type="text"
                required
                value={hackForm.title}
                onChange={(e) =>
                  setHackForm((prev: any) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Category *
              </label>
              <select
                required
                value={hackForm.categoryId}
                onChange={(e) =>
                  setHackForm((prev: any) => ({
                    ...prev,
                    categoryId: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              >
                <option value="">Select category...</option>
                {categories.map((cat: HackCategory) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Short Description
            </label>
            <textarea
              value={hackForm.shortDescription}
              onChange={(e) =>
                setHackForm((prev: any) => ({
                  ...prev,
                  shortDescription: e.target.value,
                }))
              }
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Lead Text
            </label>
            <RichTextEditor
              value={hackForm.leadText}
              onChange={(html) =>
                setHackForm((prev: any) => ({
                  ...prev,
                  leadText: html,
                }))
              }
              rows={3}
              placeholder="Enter lead text with formatting..."
            />
          </div>

          {/* Images */}2
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Thumbnail Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageChange(e, "thumbnail")}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              {imagePreviews.thumbnail && (
                <div className="relative mt-2 h-24 w-full">
                  <Image
                    src={imagePreviews.thumbnail}
                    alt="Preview"
                    fill
                    className="rounded-lg object-cover"
                  />
                </div>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Hero Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageChange(e, "hero")}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              {imagePreviews.hero && (
                <div className="relative mt-2 h-24 w-full">
                  <Image
                    src={imagePreviews.hero}
                    alt="Preview"
                    fill
                    className="rounded-lg object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Sponsor */}
          <div>
            <label className="mb-1 block text-sm font-medium">
              Sponsor (Optional)
            </label>
            <select
              value={hackForm.sponsorId || ""}
              onChange={(e) =>
                setHackForm((prev: any) => ({
                  ...prev,
                  sponsorId: e.target.value || undefined,
                }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="">No Sponsor</option>
              {sponsors.map((sponsor: Sponsor) => (
                <option key={sponsor._id} value={sponsor._id}>
                  {sponsor.title}
                </option>
              ))}
            </select>
          </div>

          {/* Article Blocks */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-medium">
                Article Blocks
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => addBlock(ArticleBlockType.TEXT)}
                  className="rounded bg-gray-100 px-2 py-1 text-xs hover:bg-gray-200"
                  title="Add Text Block"
                >
                  <FontAwesomeIcon icon={faFileAlt} className="mr-1" />
                  Text
                </button>
                <button
                  type="button"
                  onClick={() => addBlock(ArticleBlockType.LIST)}
                  className="rounded bg-gray-100 px-2 py-1 text-xs hover:bg-gray-200"
                  title="Add List Block"
                >
                  <FontAwesomeIcon icon={faList} className="mr-1" />
                  List
                </button>
                <button
                  type="button"
                  onClick={() => addBlock(ArticleBlockType.IMAGE)}
                  className="rounded bg-gray-100 px-2 py-1 text-xs hover:bg-gray-200"
                  title="Add Image Block"
                >
                  <FontAwesomeIcon icon={faImage} className="mr-1" />
                  Image
                </button>
                <button
                  type="button"
                  onClick={() => addBlock(ArticleBlockType.VIDEO)}
                  className="rounded bg-gray-100 px-2 py-1 text-xs hover:bg-gray-200"
                  title="Add Video Block"
                >
                  <FontAwesomeIcon icon={faVideo} className="mr-1" />
                  Video
                </button>
              </div>
            </div>

            <div className="max-h-64 space-y-3 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-3">
              {hackForm.articleBlocks.length === 0 ? (
                <p className="text-center text-sm text-gray-500">
                  No blocks added yet. Click the buttons above to add content.
                </p>
              ) : (
                hackForm.articleBlocks.map((block: ArticleBlock, index: number) => (
                  <BlockEditor
                    key={block.id}
                    block={block}
                    index={index}
                    updateBlock={updateBlock}
                    removeBlock={removeBlock}
                    moveBlock={moveBlock}
                    isFirst={index === 0}
                    isLast={index === hackForm.articleBlocks.length - 1}
                  />
                ))
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-saveful-green px-4 py-2 text-white hover:bg-green-600 disabled:bg-gray-300"
            >
              <FontAwesomeIcon icon={faSave} className="mr-2" />
              {isSubmitting
                ? isEditing
                  ? "Updating..."
                  : "Creating..."
                : isEditing
                ? "Update Hack"
                : "Create Hack"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// Block Editor Component
function BlockEditor({
  block,
  index,
  updateBlock,
  removeBlock,
  moveBlock,
  isFirst,
  isLast,
}: any) {
  const [expanded, setExpanded] = useState(true);

  const getBlockIcon = (type: ArticleBlockType) => {
    switch (type) {
      case ArticleBlockType.TEXT:
        return faFileAlt;
      case ArticleBlockType.IMAGE:
        return faImage;
      case ArticleBlockType.VIDEO:
        return faVideo;
      case ArticleBlockType.LIST:
        return faList;
      case ArticleBlockType.ACCORDION:
        return faChevronDown;
      case ArticleBlockType.IMAGE_DETAILS:
        return faInfoCircle;
      default:
        return faFileAlt;
    }
  };

  return (
    <div className="rounded-lg border border-gray-300 bg-gray-50">
      <div className="flex items-center justify-between border-b border-gray-300 bg-white px-3 py-2">
        <div className="flex items-center gap-2">
          <FontAwesomeIcon
            icon={getBlockIcon(block.type)}
            className="text-gray-600"
          />
          <span className="font-medium capitalize text-gray-700">
            {block.type} Block
          </span>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => moveBlock(index, "up")}
            disabled={isFirst}
            className="rounded px-2 py-1 text-xs hover:bg-gray-100 disabled:text-gray-300"
            title="Move Up"
          >
            <FontAwesomeIcon icon={faArrowUp} />
          </button>
          <button
            type="button"
            onClick={() => moveBlock(index, "down")}
            disabled={isLast}
            className="rounded px-2 py-1 text-xs hover:bg-gray-100 disabled:text-gray-300"
            title="Move Down"
          >
            <FontAwesomeIcon icon={faArrowDown} />
          </button>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="rounded px-2 py-1 text-xs hover:bg-gray-100"
            title={expanded ? "Collapse" : "Expand"}
          >
            <FontAwesomeIcon
              icon={faChevronDown}
              className={`transition-transform ${expanded ? "rotate-180" : ""}`}
            />
          </button>
          <button
            type="button"
            onClick={() => removeBlock(index)}
            className="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50"
            title="Remove Block"
          >
            <FontAwesomeIcon icon={faTrash} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="p-3">
          {block.type === ArticleBlockType.TEXT && (
            <RichTextEditor
              value={(block as TextBlock).text}
              onChange={(html) => updateBlock(index, { text: html })}
              placeholder="Enter formatted text..."
              rows={4}
            />
          )}

          {block.type === ArticleBlockType.IMAGE && (
            <input
              type="url"
              value={(block as ImageBlock).imageUrl}
              onChange={(e) =>
                updateBlock(index, { imageUrl: e.target.value })
              }
              placeholder="Image URL"
              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
            />
          )}

          {block.type === ArticleBlockType.VIDEO && (
            <div className="space-y-2">
              <input
                type="url"
                value={(block as VideoBlock).videoUrl}
                onChange={(e) =>
                  updateBlock(index, { videoUrl: e.target.value })
                }
                placeholder="YouTube URL"
                className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
              />
              <input
                type="text"
                value={(block as VideoBlock).videoCaption || ""}
                onChange={(e) =>
                  updateBlock(index, { videoCaption: e.target.value })
                }
                placeholder="Video Caption (optional)"
                className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
              />
            </div>
          )}

          {block.type === ArticleBlockType.LIST && (
            <ListBlockEditor block={block as ListBlock} index={index} updateBlock={updateBlock} />
          )}
        </div>
      )}
    </div>
  );
}

// List Block Editor Component
function ListBlockEditor({ block, index, updateBlock }: any) {
  const addListItem = () => {
    const newItem = { id: `item-${Date.now()}`, listText: "" };
    updateBlock(index, {
      listItems: [...block.listItems, newItem],
    });
  };

  const updateListItem = (itemIndex: number, text: string) => {
    const newItems = [...block.listItems];
    newItems[itemIndex].listText = text;
    updateBlock(index, { listItems: newItems });
  };

  const removeListItem = (itemIndex: number) => {
    updateBlock(index, {
      listItems: block.listItems.filter((_: any, i: number) => i !== itemIndex),
    });
  };

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={block.listTitle}
        onChange={(e) => updateBlock(index, { listTitle: e.target.value })}
        placeholder="List Title"
        className="w-full rounded border border-gray-300 px-2 py-1 text-sm font-medium"
      />
      <div className="space-y-2">
        {block.listItems.map((item: any, itemIndex: number) => (
          <div key={item.id} className="flex gap-2">
            <span className="flex h-8 w-6 items-center justify-center text-xs font-medium text-gray-600">
              {itemIndex + 1}.
            </span>
            <input
              type="text"
              value={item.listText}
              onChange={(e) => updateListItem(itemIndex, e.target.value)}
              placeholder="List item text (HTML supported)"
              className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
            />
            <button
              type="button"
              onClick={() => removeListItem(itemIndex)}
              className="rounded px-2 text-red-500 hover:bg-red-50"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addListItem}
        className="w-full rounded border border-dashed border-gray-300 py-2 text-sm text-gray-600 hover:bg-gray-50"
      >
        <FontAwesomeIcon icon={faPlus} className="mr-1" />
        Add List Item
      </button>
    </div>
  );
}
