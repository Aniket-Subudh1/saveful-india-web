"use client";
import { useAuth, useCurrentUser } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  recipeManagementService,
  Recipe,
  UpdateRecipeDto,
} from "@/services/recipeManagementService";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getAdminSidebarLinks } from "@/config/sidebar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faSave } from "@fortawesome/free-solid-svg-icons";

export default function EditRecipePage() {
  const { isLoading } = useAuth("admin");
  const user = useCurrentUser("admin");
  const router = useRouter();
  const params = useParams();
  const recipeId = params.id as string;

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loadingRecipe, setLoadingRecipe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user && recipeId) {
      fetchRecipe();
    }
  }, [isLoading, user, recipeId]);

  const fetchRecipe = async () => {
    try {
      setLoadingRecipe(true);
      const data = await recipeManagementService.getRecipeById(recipeId);
      setRecipe(data);
    } catch (error: any) {
      console.error("Error fetching recipe:", error);
      alert("Failed to load recipe");
      router.push("/admin/recipes");
    } finally {
      setLoadingRecipe(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipe) return;

    setIsSubmitting(true);
    try {
      const updateData: UpdateRecipeDto = {
        title: recipe.title,
        shortDescription: recipe.shortDescription,
        longDescription: recipe.longDescription,
        portions: recipe.portions,
        prepCookTime: recipe.prepCookTime,
        frameworkCategories: recipe.frameworkCategories,
        components: recipe.components,
        youtubeId: recipe.youtubeId,
        hackOrTipIds: recipe.hackOrTipIds,
        stickerId: recipe.stickerId,
        sponsorId: recipe.sponsorId,
        fridgeKeepTime: recipe.fridgeKeepTime,
        freezeKeepTime: recipe.freezeKeepTime,
        useLeftoversIn: recipe.useLeftoversIn,
        isActive: recipe.isActive,
      };

      await recipeManagementService.updateRecipe(recipeId, updateData);
      alert("Recipe updated successfully!");
      router.push("/admin/recipes");
      router.refresh();
    } catch (error: any) {
      console.error("Error updating recipe:", error);
      alert(error?.response?.data?.message || "Failed to update recipe");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || loadingRecipe) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!recipe) {
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
        <div className="relative z-10 mx-auto max-w-5xl">
          {/* Header */}
          <div className="mb-6 flex items-center gap-4">
            <button
              onClick={() => router.push("/admin/recipes")}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white shadow-sm transition hover:bg-gray-50"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
            </button>
            <div>
              <h1 className="font-saveful-bold text-3xl text-gray-900">Edit Recipe</h1>
              <p className="mt-1 font-saveful text-sm text-gray-600">{recipe.title}</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md">
              <h2 className="mb-4 font-saveful-bold text-xl text-gray-900">Edit Basic Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block font-saveful-semibold text-sm text-gray-700">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={recipe.title}
                    onChange={(e) => setRecipe({ ...recipe, title: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 font-saveful focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block font-saveful-semibold text-sm text-gray-700">
                      Portions <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={recipe.portions}
                      onChange={(e) => setRecipe({ ...recipe, portions: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 font-saveful focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-saveful-semibold text-sm text-gray-700">
                      Prep & Cook Time (minutes) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      value={recipe.prepCookTime}
                      onChange={(e) => setRecipe({ ...recipe, prepCookTime: parseInt(e.target.value) || 0 })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 font-saveful focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block font-saveful-semibold text-sm text-gray-700">
                    Short Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    value={recipe.shortDescription}
                    onChange={(e) => setRecipe({ ...recipe, shortDescription: e.target.value })}
                    rows={2}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 font-saveful focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-saveful-semibold text-sm text-gray-700">
                    Active Status
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={recipe.isActive}
                      onChange={(e) => setRecipe({ ...recipe, isActive: e.target.checked })}
                      className="rounded border-gray-300 text-saveful-green focus:ring-saveful-green"
                    />
                    <span className="font-saveful text-sm">Recipe is active</span>
                  </label>
                </div>

                <div className="rounded-lg bg-amber-50 p-4 border border-amber-200">
                  <p className="font-saveful text-sm text-amber-800">
                    <strong>Note:</strong> For full editing of components and ingredients, you'll need to use the complete form. This simplified editor only allows you to update basic information.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      alert("Full recipe editor with component management coming soon! For now, you can edit basic fields or create a new recipe with the full form.");
                    }}
                    className="mt-2 rounded bg-amber-500 px-3 py-1.5 font-saveful-semibold text-sm text-white transition hover:bg-amber-600"
                  >
                    Learn More
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="sticky bottom-0 flex gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
              <button
                type="button"
                onClick={() => router.push("/admin/recipes")}
                className="flex-1 rounded-lg border-2 border-gray-300 px-4 py-2.5 font-saveful-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 rounded-lg bg-saveful-green px-4 py-2.5 font-saveful-semibold text-white shadow-md transition hover:bg-green-600 hover:shadow-lg disabled:bg-gray-300 disabled:shadow-none"
              >
                <FontAwesomeIcon icon={faSave} className="mr-2" />
                {isSubmitting ? "Updating..." : "Update Recipe"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
