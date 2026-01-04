"use client";
import { useAuth, useCurrentUser } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import {
  foodFactManagementService,
  FoodFact,
  CreateFoodFactDto,
  UpdateFoodFactDto,
} from "@/services/foodFactManagementService";
import { sponsorManagementService, Sponsor } from "@/services/sponsorManagementService";
import { ingredientManagementService } from "@/services/ingredientManagementService";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getAdminSidebarLinks } from "@/config/sidebar";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faTimes,
  faSave,
  faEdit,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";

interface Ingredient {
  _id: string;
  name: string;
}

export default function FoodFactsPage() {
  const { isLoading } = useAuth("admin");
  const user = useCurrentUser("admin");
  const router = useRouter();

  const [foodFacts, setFoodFacts] = useState<FoodFact[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingFoodFact, setEditingFoodFact] = useState<FoodFact | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [foodFactForm, setFoodFactForm] = useState({
    title: "",
    sponsor: "",
    relatedIngredient: "",
    factOrInsight: "",
  });

  useEffect(() => {
    if (!isLoading && user) {
      fetchData();
    }
  }, [isLoading, user]);

  const fetchData = async () => {
    try {
      const [foodFactsData, sponsorsData, ingredientsData] = await Promise.all([
        foodFactManagementService.getAllFoodFacts(),
        sponsorManagementService.getAllSponsors(),
        ingredientManagementService.getAllIngredients(),
      ]);
      setFoodFacts(foodFactsData);
      setSponsors(sponsorsData);
      setIngredients(ingredientsData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  };

  const openCreateModal = () => {
    setEditingFoodFact(null);
    setFoodFactForm({
      title: "",
      sponsor: "",
      relatedIngredient: "",
      factOrInsight: "",
    });
    setShowModal(true);
  };

  const openEditModal = (foodFact: FoodFact) => {
    setEditingFoodFact(foodFact);
    setFoodFactForm({
      title: foodFact.title,
      sponsor: typeof foodFact.sponsor === "object" ? foodFact.sponsor._id : "",
      relatedIngredient: typeof foodFact.relatedIngredient === "object" ? foodFact.relatedIngredient._id : "",
      factOrInsight: foodFact.factOrInsight || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      if (!foodFactForm.title) {
        alert("Please fill in the title field");
        return;
      }

      setIsSubmitting(true);

      if (editingFoodFact) {
        // Update existing food fact
        const updateDto: UpdateFoodFactDto = {
          title: foodFactForm.title,
          sponsor: foodFactForm.sponsor || undefined,
          relatedIngredient: foodFactForm.relatedIngredient || undefined,
          factOrInsight: foodFactForm.factOrInsight || undefined,
        };

        await foodFactManagementService.updateFoodFact(editingFoodFact._id, updateDto);
        alert("Food fact updated successfully!");
      } else {
        // Create new food fact
        const createDto: CreateFoodFactDto = {
          title: foodFactForm.title,
          sponsor: foodFactForm.sponsor || undefined,
          relatedIngredient: foodFactForm.relatedIngredient || undefined,
          factOrInsight: foodFactForm.factOrInsight || undefined,
        };

        await foodFactManagementService.createFoodFact(createDto);
        alert("Food fact created successfully!");
      }

      // Reset and refresh
      setShowModal(false);
      setEditingFoodFact(null);
      setFoodFactForm({
        title: "",
        sponsor: "",
        relatedIngredient: "",
        factOrInsight: "",
      });
      await fetchData();
    } catch (error: any) {
      console.error("Failed to save food fact:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        (error?.response?.status === 401
          ? "Session expired. Please login again."
          : "Failed to save food fact. Please check the console for details.");

      alert(errorMessage);

      if (error?.response?.status === 401 || error?.message?.includes("token")) {
        router.push("/admin/login");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this food fact?")) {
      return;
    }

    try {
      await foodFactManagementService.deleteFoodFact(id);
      alert("Food fact deleted successfully!");
      await fetchData();
    } catch (error: any) {
      console.error("Failed to delete food fact:", error);
      alert(error?.response?.data?.message || "Failed to delete food fact");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
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
            <path
              fill="#10B981"
              d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,79.6,-45.8C87.4,-32.6,90,-16.3,88.5,-0.9C87,14.6,81.4,29.2,72.8,41.7C64.2,54.2,52.6,64.6,39.1,71.8C25.6,79,10.2,83,-5.6,83.3C-21.4,83.6,-42.8,80.2,-58.3,71.2C-73.8,62.2,-83.4,47.6,-87.7,31.8C-92,16,-91,-1,-84.9,-16.2C-78.8,-31.4,-67.6,-44.8,-54.2,-52.4C-40.8,-60,-25.2,-61.8,-10.4,-64.8C4.4,-67.8,8.8,-72,44.7,-76.4Z"
              transform="translate(100 100)"
            />
          </svg>
        </div>

        <div className="relative z-10 mx-auto max-w-7xl space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="font-saveful-bold text-3xl text-gray-900 md:text-4xl">
                Food Facts Management
              </h1>
              <p className="mt-2 font-saveful text-sm text-gray-600">
                Manage food facts with images, sponsors, and ingredients
              </p>
            </div>
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 rounded-lg bg-saveful-green px-4 py-2.5 font-saveful-semibold text-white shadow-lg transition hover:bg-green-600 hover:shadow-xl"
            >
              <FontAwesomeIcon icon={faPlus} />
              New Food Fact
            </button>
          </div>

          {/* Food Facts Grid */}
          {foodFacts.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <FontAwesomeIcon icon={faPlus} className="h-8 w-8 text-saveful-green" />
              </div>
              <h3 className="mb-2 font-saveful-semibold text-lg text-gray-800">
                No food facts yet
              </h3>
              <p className="mb-4 font-saveful text-sm text-gray-600">
                Get started by creating your first food fact
              </p>
              <button
                onClick={openCreateModal}
                className="font-saveful-semibold text-saveful-green hover:underline"
              >
                Create your first food fact
              </button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence>
                {foodFacts.map((foodFact) => (
                  <motion.div
                    key={foodFact._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    whileHover={{ y: -4 }}
                    className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md transition-shadow hover:shadow-xl"
                  >
                    {/* Content */}
                    <div className="p-5 space-y-3">
                      <h3 className="font-saveful-bold text-lg text-gray-900 line-clamp-2">
                        {foodFact.title}
                      </h3>

                      {foodFact.factOrInsight && (
                        <p className="font-saveful text-sm text-gray-600 line-clamp-3">
                          {foodFact.factOrInsight}
                        </p>
                      )}

                      {/* Meta Info */}
                      <div className="space-y-1.5">
                        {foodFact.sponsor && typeof foodFact.sponsor === "object" && (
                          <div className="flex items-center gap-2">
                            <span className="font-saveful text-xs text-gray-500">Sponsor:</span>
                            <span className="font-saveful-semibold text-xs text-saveful-orange">
                              {foodFact.sponsor.title}
                            </span>
                          </div>
                        )}
                        {foodFact.relatedIngredient && typeof foodFact.relatedIngredient === "object" && (
                          <div className="flex items-center gap-2">
                            <span className="font-saveful text-xs text-gray-500">Ingredient:</span>
                            <span className="font-saveful-semibold text-xs text-green-600">
                              {foodFact.relatedIngredient.name}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => openEditModal(foodFact)}
                          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-500 px-3 py-2 font-saveful-semibold text-sm text-white transition hover:bg-blue-600"
                        >
                          <FontAwesomeIcon icon={faEdit} className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(foodFact._id)}
                          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-500 px-3 py-2 font-saveful-semibold text-sm text-white transition hover:bg-red-600"
                        >
                          <FontAwesomeIcon icon={faTrash} className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Food Fact Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={() => !isSubmitting && setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-8 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-saveful-bold text-2xl text-gray-900">
                  {editingFoodFact ? "Edit Food Fact" : "Create Food Fact"}
                </h2>
                <button
                  onClick={() => !isSubmitting && setShowModal(false)}
                  disabled={isSubmitting}
                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                >
                  <FontAwesomeIcon icon={faTimes} className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-5">
                {/* Title */}
                <div>
                  <label className="mb-2 block font-saveful-semibold text-sm text-gray-700">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={foodFactForm.title}
                    onChange={(e) =>
                      setFoodFactForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="e.g., Farm fact"
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-2.5 font-saveful transition-colors focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
                  />
                </div>

                {/* Fact or Insight */}
                <div>
                  <label className="mb-2 block font-saveful-semibold text-sm text-gray-700">
                    Fact or Insight
                  </label>
                  <textarea
                    value={foodFactForm.factOrInsight}
                    onChange={(e) =>
                      setFoodFactForm((prev) => ({
                        ...prev,
                        factOrInsight: e.target.value,
                      }))
                    }
                    placeholder="Interesting fact about food..."
                    rows={4}
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-2.5 font-saveful transition-colors focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20 resize-none"
                  />
                </div>

                {/* Sponsor */}
                <div>
                  <label className="mb-2 block font-saveful-semibold text-sm text-gray-700">
                    Sponsor (Optional)
                  </label>
                  <select
                    value={foodFactForm.sponsor}
                    onChange={(e) =>
                      setFoodFactForm((prev) => ({
                        ...prev,
                        sponsor: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-2.5 font-saveful transition-colors focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
                  >
                    <option value="">-- No Sponsor --</option>
                    {sponsors.map((sponsor) => (
                      <option key={sponsor._id} value={sponsor._id}>
                        {sponsor.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Related Ingredient */}
                <div>
                  <label className="mb-2 block font-saveful-semibold text-sm text-gray-700">
                    Related Ingredient (Optional)
                  </label>
                  <select
                    value={foodFactForm.relatedIngredient}
                    onChange={(e) =>
                      setFoodFactForm((prev) => ({
                        ...prev,
                        relatedIngredient: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-2.5 font-saveful transition-colors focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
                  >
                    <option value="">-- No Ingredient --</option>
                    {ingredients.map((ingredient) => (
                      <option key={ingredient._id} value={ingredient._id}>
                        {ingredient.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-6">
                  <button
                    onClick={() => !isSubmitting && setShowModal(false)}
                    disabled={isSubmitting}
                    className="flex-1 rounded-lg border-2 border-gray-300 bg-white px-4 py-2.5 font-saveful-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-saveful-green px-4 py-2.5 font-saveful-semibold text-white shadow-lg transition-all hover:bg-green-600 hover:shadow-xl disabled:opacity-50 disabled:shadow-none"
                  >
                    <FontAwesomeIcon icon={faSave} />
                    {isSubmitting
                      ? editingFoodFact
                        ? "Updating..."
                        : "Creating..."
                      : editingFoodFact
                      ? "Update Food Fact"
                      : "Create Food Fact"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
