"use client";
import { useAuth, useCurrentUser } from "@/hooks/useAuth";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  recipeManagementService,
  Recipe,
  CreateRecipeDto,
  UpdateRecipeDto,
  RecipeComponentWrapper,
  Component,
  RequiredIngredient,
  OptionalIngredient,
  ComponentStep,
} from "@/services/recipeManagementService";
import { frameworkCategoryManagementService, FrameworkCategory as FwCategory } from "@/services/frameworkCategoryManagementService";
import { ingredientManagementService, Ingredient } from "@/services/ingredientManagementService";
import { hackOrTipManagementService, HackOrTip } from "@/services/hackOrTipManagementService";
import { sponsorManagementService, Sponsor } from "@/services/sponsorManagementService";
import { stickerManagementService, Sticker } from "@/services/stickerManagementService";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getAdminSidebarLinks } from "@/config/sidebar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faPlus, faTrash, faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";

export default function EditRecipePage() {
  const { isLoading } = useAuth("admin");
  const user = useCurrentUser("admin");
  const router = useRouter();
  const params = useParams();
  const recipeId = params.id as string;

  // Form state mirrors CreateRecipeDto for ease, then transformed to UpdateRecipeDto
  const [recipeForm, setRecipeForm] = useState<CreateRecipeDto>({
    title: "",
    shortDescription: "",
    longDescription: "",
    portions: "",
    prepCookTime: 0,
    frameworkCategories: [],
    hackOrTipIds: [],
    useLeftoversIn: [],
    components: [],
    isActive: true,
  });

  const [heroImage, setHeroImage] = useState<File | null>(null);
  const [heroImagePreview, setHeroImagePreview] = useState<string | null>(null);

  // Dropdown/reference data
  const [frameworkCategories, setFrameworkCategories] = useState<FwCategory[]>([]);
  const [hackOrTips, setHackOrTips] = useState<HackOrTip[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  const [loadingRecipe, setLoadingRecipe] = useState(true);
  const [loadingData, setLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user && recipeId) {
      // Load reference data and existing recipe
      fetchData();
    }
  }, [isLoading, user, recipeId]);

  const fetchData = async () => {
    try {
      setLoadingData(true);
      const [cats, hacks, spons, sticks, ings, rec, current] = await Promise.all([
        frameworkCategoryManagementService.getAllCategories(),
        hackOrTipManagementService.getAll(),
        sponsorManagementService.getAllSponsors(),
        stickerManagementService.getAll(),
        ingredientManagementService.getAllIngredients(),
        recipeManagementService.getAllRecipes(),
        recipeManagementService.getRecipeById(recipeId),
      ]);
      setFrameworkCategories(cats);
      setHackOrTips(hacks);
      setSponsors(spons);
      setStickers(sticks as any);
      setIngredients(ings);
      setRecipes(rec);
      
      const normalizeId = (value: any) => {
        if (!value) return "";
        if (typeof value === "string") return value;
        if (typeof value === "object") {
          // Handle MongoDB $oid format
          if (value.$oid) return value.$oid.toString();
          // Handle populated/expanded objects with _id
          if (value._id) return value._id.toString();
          return (value.id || "").toString();
        }
        return "";
      };
      const isValidObjectIdString = (val: string) => /^[a-fA-F0-9]{24}$/.test(val);
      const normalizeIdArray = (list: any[] | undefined) => {
        const result = (list || [])
          .map((v) => {
            if (typeof v === "string") return v;
            // Handle both $oid and populated objects
            if (typeof v === "object") {
              if (v.$oid) return v.$oid.toString();
              if (v._id) return v._id.toString();
              return (v.id || "").toString();
            }
            return "";
          })
          .filter((v) => typeof v === "string" && isValidObjectIdString(v));
        return result;
      };

      const normalizeComponents = (components: RecipeComponentWrapper[]) => {
        return (components || []).map((wrapper) => ({
          ...wrapper,
          component: (wrapper.component || []).map((comp) => ({
            ...comp,
            requiredIngredients: (comp.requiredIngredients || []).map((ri) => ({
              ...ri,
              recommendedIngredient: normalizeId(ri.recommendedIngredient),
              alternativeIngredients: (ri.alternativeIngredients || []).map((alt) => ({
                ...alt,
                ingredient: normalizeId(alt.ingredient),
              })),
            })),
            optionalIngredients: (comp.optionalIngredients || []).map((oi) => ({
              ...oi,
              ingredient: normalizeId(oi.ingredient),
            })),
            componentSteps: (comp.componentSteps || []).map((step) => ({
              ...step,
              relevantIngredients: normalizeIdArray(step.relevantIngredients),
              hackOrTipIds: normalizeIdArray(step.hackOrTipIds),
            })),
          })),
        }));
      };
      const normalizeUseLeftoversIn = (vals: any[] | undefined) => {
        const list = vals || [];
        const ids = list
          .map((v) => {
            if (typeof v === "string") {
              if (isValidObjectIdString(v)) return v;
              const byTitle = rec.find((r) => r.title.toLowerCase() === v.toLowerCase());
              return byTitle?._id;
            }
            if (typeof v === "object") {
              return normalizeId(v);
            }
            return undefined;
          })
          .filter((v): v is string => typeof v === "string" && isValidObjectIdString(v));
        return ids;
      };
      // Populate form from current recipe
      const normalizedFrameworkCategories = normalizeIdArray(current.frameworkCategories);
      const normalizedHackOrTipIds = normalizeIdArray(current.hackOrTipIds);
      const normalizedSponsorId = normalizeId(current.sponsorId);
      const normalizedStickerId = normalizeId(current.stickerId);
      
      setRecipeForm({
        title: current.title,
        shortDescription: current.shortDescription,
        longDescription: current.longDescription,
        portions: current.portions,
        prepCookTime: current.prepCookTime,
        frameworkCategories: normalizedFrameworkCategories,
        hackOrTipIds: normalizedHackOrTipIds,
        useLeftoversIn: normalizeUseLeftoversIn(current.useLeftoversIn || []),
        components: normalizeComponents(current.components || []),
        isActive: current.isActive ?? true,
        heroImageUrl: current.heroImageUrl,
        youtubeId: current.youtubeId,
        stickerId: normalizedStickerId,
        sponsorId: normalizedSponsorId,
        fridgeKeepTime: current.fridgeKeepTime,
        freezeKeepTime: current.freezeKeepTime,
        order: current.order,
      } as CreateRecipeDto & Partial<Recipe>);
      setHeroImagePreview(current.heroImageUrl || null);
    } catch (error: any) {
      console.error("Error loading data:", error);
      alert(error?.response?.data?.message || "Failed to load recipe or data");
      router.push("/admin/recipes");
    } finally {
      setLoadingData(false);
      setLoadingRecipe(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate image size (max 5MB to prevent timeout)
      const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSizeInBytes) {
        alert(`Image file is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Please select an image smaller than 5MB to avoid timeout issues.`);
        e.target.value = ''; // Clear the input
        return;
      }

      setHeroImage(file);
      const reader = new FileReader();
      reader.onload = () => setHeroImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const isValidObjectIdString = (val: string) => /^[a-fA-F0-9]{24}$/.test(val);
      const normalizeId = (value: any) => {
        if (!value) return "";
        if (typeof value === "string") return value;
        if (typeof value === "object") {
          return (value._id || (value as any).id || "").toString();
        }
        return "";
      };
      const sanitizeIdArray = (arr: any[] | undefined) =>
        (arr || [])
          .map((v) => (typeof v === "string" ? v : normalizeId(v)))
          .filter((v) => typeof v === "string" && isValidObjectIdString(v));
      const sanitizeComponents = (components: RecipeComponentWrapper[] | undefined) => {
        return (components || []).map((wrapper) => ({
          ...wrapper,
          component: (wrapper.component || []).map((comp) => ({
            ...comp,
            requiredIngredients: (comp.requiredIngredients || []).map((ri) => ({
              ...ri,
              recommendedIngredient: normalizeId(ri.recommendedIngredient),
              alternativeIngredients: (ri.alternativeIngredients || []).map((alt) => ({
                ...alt,
                ingredient: normalizeId(alt.ingredient),
              })),
            })),
            optionalIngredients: (comp.optionalIngredients || []).map((oi) => ({
              ...oi,
              ingredient: normalizeId(oi.ingredient),
            })),
            componentSteps: (comp.componentSteps || []).map((step) => ({
              ...step,
              relevantIngredients: sanitizeIdArray(step.relevantIngredients),
              hackOrTipIds: sanitizeIdArray(step.hackOrTipIds),
            })),
          })),
        }));
      };

      // Transform to UpdateRecipeDto, only include fields that exist
      const updateData: UpdateRecipeDto = {
        title: recipeForm.title?.trim(),
        shortDescription: recipeForm.shortDescription,
        longDescription: recipeForm.longDescription,
        portions: recipeForm.portions,
        prepCookTime: recipeForm.prepCookTime,
        frameworkCategories: sanitizeIdArray(recipeForm.frameworkCategories),
        components: sanitizeComponents(recipeForm.components),
        youtubeId: (recipeForm as any).youtubeId,
        hackOrTipIds: sanitizeIdArray(recipeForm.hackOrTipIds),
        stickerId: (recipeForm as any).stickerId,
        sponsorId: (recipeForm as any).sponsorId,
        fridgeKeepTime: (recipeForm as any).fridgeKeepTime,
        freezeKeepTime: (recipeForm as any).freezeKeepTime,
        useLeftoversIn: sanitizeIdArray(recipeForm.useLeftoversIn),
        order: (recipeForm as any).order,
        isActive: recipeForm.isActive,
      };

      // Comprehensive frontend validation before sending to backend
      const validationErrors: string[] = [];

      // Check components structure
      if (updateData.components && updateData.components.length === 0) {
        validationErrors.push("At least one component wrapper is required");
      }

      if (updateData.components) {
        updateData.components.forEach((wrapper: any, wrapperIndex: number) => {
          if (wrapper.component.length === 0) {
            validationErrors.push(`Component wrapper ${wrapperIndex + 1} must have at least one component`);
          }

          wrapper.component.forEach((comp: any, compIndex: number) => {
            if (!comp.componentTitle || comp.componentTitle.trim() === '') {
              validationErrors.push(`Component ${compIndex + 1} in wrapper ${wrapperIndex + 1} must have a title`);
            }

            // Check required ingredients
            (comp.requiredIngredients || []).forEach((ing: any, ingIndex: number) => {
              if (!ing.recommendedIngredient || ing.recommendedIngredient.trim() === '') {
                validationErrors.push(
                  `Required ingredient ${ingIndex + 1} in component ${compIndex + 1}, wrapper ${wrapperIndex + 1} must have a selected ingredient`
                );
              }
            });

            // Check optional ingredients
            (comp.optionalIngredients || []).forEach((ing: any, ingIndex: number) => {
              if (!ing.ingredient || ing.ingredient.trim() === '') {
                validationErrors.push(
                  `Optional ingredient ${ingIndex + 1} in component ${compIndex + 1}, wrapper ${wrapperIndex + 1} must have a selected ingredient`
                );
              }
            });
          });
        });
      }

      // Check framework categories
      if (updateData.frameworkCategories && updateData.frameworkCategories.length === 0) {
        validationErrors.push("At least one framework category is required");
      }

      // Display validation errors if any
      if (validationErrors.length > 0) {
        alert("Please fix the following errors:\n\n" + validationErrors.join("\n"));
        setIsSubmitting(false);
        return;
      }

      await recipeManagementService.updateRecipe(recipeId, updateData, heroImage || undefined);
      alert("Recipe updated successfully!");
      router.push("/admin/recipes");
      router.refresh();
    } catch (error: any) {
      console.error("Error updating recipe:", error);
      console.error("Error response:", error?.response?.data);

      // Better error messaging
      let errorMessage = "Failed to update recipe";
      
      // Handle abort/timeout errors
      if (error?.name === 'AbortError') {
        errorMessage = "Request timeout: The recipe update took too long (>2 minutes). This might be due to a large image or network issues. Please try again with a smaller image.";
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.response?.data?.errors) {
        // Format validation errors more clearly
        const validationErrors = error.response.data.errors;
        errorMessage = "Validation failed:\n\n";
        validationErrors.forEach((err: any) => {
          errorMessage += `- ${err.property}: ${Object.values(err.constraints || {}).join(', ')}\n`;
          if (err.children && err.children.length > 0) {
            err.children.forEach((child: any) => {
              errorMessage += `  - ${child.property}: ${Object.values(child.constraints || {}).join(', ')}\n`;
            });
          }
        });
      } else if (error?.message) {
        errorMessage = error.message;
      }

      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || loadingRecipe || loadingData) {
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
        <div className="relative z-10 mx-auto max-w-7xl">
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
              <p className="mt-1 font-saveful text-sm text-gray-600">{recipeForm.title}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <BasicInformationCard
              recipeForm={recipeForm}
              setRecipeForm={setRecipeForm}
              frameworkCategories={frameworkCategories}
              sponsors={sponsors}
              stickers={stickers}
              hackOrTips={hackOrTips}
              recipes={recipes}
              heroImagePreview={heroImagePreview}
              handleImageChange={handleImageChange}
            />

            <ComponentsCard
              recipeForm={recipeForm}
              addComponentWrapper={() => {
                const newWrapper: RecipeComponentWrapper = {
                  prepShortDescription: "",
                  prepLongDescription: "",
                  variantTags: [],
                  stronglyRecommended: false,
                  choiceInstructions: "",
                  buttonText: "",
                  component: [],
                };
                setRecipeForm((prev) => ({
                  ...prev,
                  components: [...prev.components, newWrapper],
                }));
              }}
              updateComponentWrapper={(index: number, updates: Partial<RecipeComponentWrapper>) => {
                setRecipeForm((prev) => ({
                  ...prev,
                  components: prev.components.map((wrapper, i) =>
                    i === index ? { ...wrapper, ...updates } : wrapper
                  ),
                }));
              }}
              removeComponentWrapper={(index: number) => {
                setRecipeForm((prev) => ({
                  ...prev,
                  components: prev.components.filter((_, i) => i !== index),
                }));
              }}
              moveComponentWrapper={(index: number, direction: "up" | "down") => {
                const newIndex = direction === "up" ? index - 1 : index + 1;
                if (newIndex < 0 || newIndex >= recipeForm.components.length) return;
                setRecipeForm((prev) => {
                  const arr = [...prev.components];
                  const [item] = arr.splice(index, 1);
                  arr.splice(newIndex, 0, item);
                  return { ...prev, components: arr };
                });
              }}
              addComponent={(wrapperIndex: number) => {
                const newComponent: Component = {
                  componentTitle: "",
                  componentInstructions: "",
                  includedInVariants: [],
                  requiredIngredients: [],
                  optionalIngredients: [],
                  componentSteps: [],
                };
                setRecipeForm((prev) => ({
                  ...prev,
                  components: prev.components.map((w, i) =>
                    i === wrapperIndex ? { ...w, component: [...(w.component || []), newComponent] } : w
                  ),
                }));
              }}
              updateComponent={(wrapperIndex: number, componentIndex: number, updates: Partial<Component>) => {
                const updated = recipeForm.components[wrapperIndex].component.map((comp, i) =>
                  i === componentIndex ? { ...comp, ...updates } : comp
                );
                const wrapper = recipeForm.components[wrapperIndex];
                const next = { ...wrapper, component: updated };
                setRecipeForm((prev) => ({
                  ...prev,
                  components: prev.components.map((w, i) => (i === wrapperIndex ? next : w)),
                }));
              }}
              removeComponent={(wrapperIndex: number, componentIndex: number) => {
                const updated = recipeForm.components[wrapperIndex].component.filter((_, i) => i !== componentIndex);
                const wrapper = recipeForm.components[wrapperIndex];
                const next = { ...wrapper, component: updated };
                setRecipeForm((prev) => ({
                  ...prev,
                  components: prev.components.map((w, i) => (i === wrapperIndex ? next : w)),
                }));
              }}
              addRequiredIngredient={(wrapperIndex: number, componentIndex: number) => {
                const newIngredient: RequiredIngredient = {
                  recommendedIngredient: "",
                  quantity: "",
                  preparation: "",
                  alternativeIngredients: [],
                };
                const comp = recipeForm.components[wrapperIndex].component[componentIndex];
                const nextComp = {
                  ...comp,
                  requiredIngredients: [...(comp.requiredIngredients || []), newIngredient],
                };
                const updated = recipeForm.components[wrapperIndex].component.map((c, i) => (i === componentIndex ? nextComp : c));
                const nextWrapper = { ...recipeForm.components[wrapperIndex], component: updated };
                setRecipeForm((prev) => ({
                  ...prev,
                  components: prev.components.map((w, i) => (i === wrapperIndex ? nextWrapper : w)),
                }));
              }}
              updateRequiredIngredient={(wrapperIndex: number, componentIndex: number, ingredientIndex: number, updates: Partial<RequiredIngredient>) => {
                const comp = recipeForm.components[wrapperIndex].component[componentIndex];
                const updatedIngredients = (comp.requiredIngredients || []).map((ing, i) =>
                  i === ingredientIndex ? { ...(ing as RequiredIngredient), ...updates } : ing
                );
                const nextComp = { ...comp, requiredIngredients: updatedIngredients };
                const updated = recipeForm.components[wrapperIndex].component.map((c, i) => (i === componentIndex ? nextComp : c));
                const nextWrapper = { ...recipeForm.components[wrapperIndex], component: updated };
                setRecipeForm((prev) => ({
                  ...prev,
                  components: prev.components.map((w, i) => (i === wrapperIndex ? nextWrapper : w)),
                }));
              }}
              removeRequiredIngredient={(wrapperIndex: number, componentIndex: number, ingredientIndex: number) => {
                const comp = recipeForm.components[wrapperIndex].component[componentIndex];
                const updatedIngredients = (comp.requiredIngredients || []).filter((_, i) => i !== ingredientIndex);
                const nextComp = { ...comp, requiredIngredients: updatedIngredients };
                const updated = recipeForm.components[wrapperIndex].component.map((c, i) => (i === componentIndex ? nextComp : c));
                const nextWrapper = { ...recipeForm.components[wrapperIndex], component: updated };
                setRecipeForm((prev) => ({
                  ...prev,
                  components: prev.components.map((w, i) => (i === wrapperIndex ? nextWrapper : w)),
                }));
              }}
              addAlternativeIngredient={(wrapperIndex: number, componentIndex: number, requiredIngredientIndex: number) => {
                const comp = recipeForm.components[wrapperIndex].component[componentIndex];
                const reqIng = comp.requiredIngredients?.[requiredIngredientIndex];
                if (!reqIng) return;
                const newAlt = { ingredient: "", inheritQuantity: false, inheritPreparation: false, quantity: "", preparation: "" };
                const nextReq = {
                  ...reqIng,
                  alternativeIngredients: [...(reqIng.alternativeIngredients || []), newAlt],
                } as RequiredIngredient;
                const nextReqs = (comp.requiredIngredients || []).map((ing, i) => (i === requiredIngredientIndex ? nextReq : ing));
                const nextComp = { ...comp, requiredIngredients: nextReqs };
                const updated = recipeForm.components[wrapperIndex].component.map((c, i) => (i === componentIndex ? nextComp : c));
                const nextWrapper = { ...recipeForm.components[wrapperIndex], component: updated };
                setRecipeForm((prev) => ({
                  ...prev,
                  components: prev.components.map((w, i) => (i === wrapperIndex ? nextWrapper : w)),
                }));
              }}
              addOptionalIngredient={(wrapperIndex: number, componentIndex: number) => {
                const comp = recipeForm.components[wrapperIndex].component[componentIndex];
                const newIng: OptionalIngredient = { ingredient: "", quantity: "", preparation: "" };
                const nextComp = {
                  ...comp,
                  optionalIngredients: [...(comp.optionalIngredients || []), newIng],
                };
                const updated = recipeForm.components[wrapperIndex].component.map((c, i) => (i === componentIndex ? nextComp : c));
                const nextWrapper = { ...recipeForm.components[wrapperIndex], component: updated };
                setRecipeForm((prev) => ({
                  ...prev,
                  components: prev.components.map((w, i) => (i === wrapperIndex ? nextWrapper : w)),
                }));
              }}
              addComponentStep={(wrapperIndex: number, componentIndex: number) => {
                const comp = recipeForm.components[wrapperIndex].component[componentIndex];
                const newStep: ComponentStep = { stepInstructions: "", hackOrTipIds: [], alwaysShow: false, relevantIngredients: [] };
                const nextComp = {
                  ...comp,
                  componentSteps: [...(comp.componentSteps || []), newStep],
                };
                const updated = recipeForm.components[wrapperIndex].component.map((c, i) => (i === componentIndex ? nextComp : c));
                const nextWrapper = { ...recipeForm.components[wrapperIndex], component: updated };
                setRecipeForm((prev) => ({
                  ...prev,
                  components: prev.components.map((w, i) => (i === wrapperIndex ? nextWrapper : w)),
                }));
              }}
              updateComponentStep={(wrapperIndex: number, componentIndex: number, stepIndex: number, updates: Partial<ComponentStep>) => {
                const comp = recipeForm.components[wrapperIndex].component[componentIndex];
                const updatedSteps = (comp.componentSteps || []).map((s, i) => (i === stepIndex ? { ...s, ...updates } : s));
                const nextComp = { ...comp, componentSteps: updatedSteps };
                const updated = recipeForm.components[wrapperIndex].component.map((c, i) => (i === componentIndex ? nextComp : c));
                const nextWrapper = { ...recipeForm.components[wrapperIndex], component: updated };
                setRecipeForm((prev) => ({
                  ...prev,
                  components: prev.components.map((w, i) => (i === wrapperIndex ? nextWrapper : w)),
                }));
              }}
              removeComponentStep={(wrapperIndex: number, componentIndex: number, stepIndex: number) => {
                const comp = recipeForm.components[wrapperIndex].component[componentIndex];
                const updatedSteps = (comp.componentSteps || []).filter((_, i) => i !== stepIndex);
                const nextComp = { ...comp, componentSteps: updatedSteps };
                const updated = recipeForm.components[wrapperIndex].component.map((c, i) => (i === componentIndex ? nextComp : c));
                const nextWrapper = { ...recipeForm.components[wrapperIndex], component: updated };
                setRecipeForm((prev) => ({
                  ...prev,
                  components: prev.components.map((w, i) => (i === wrapperIndex ? nextWrapper : w)),
                }));
              }}
              ingredients={ingredients}
              hackOrTips={hackOrTips}
            />

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
                {isSubmitting ? "Updating..." : "Update Recipe"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}

function BasicInformationCard({
  recipeForm,
  setRecipeForm,
  frameworkCategories,
  sponsors,
  stickers,
  hackOrTips,
  recipes,
  heroImagePreview,
  handleImageChange,
}: any) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-saveful-bold text-xl text-gray-900">Basic Information</h2>
      </div>

      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block font-saveful-semibold text-sm text-gray-700">Title <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              value={recipeForm.title}
              onChange={(e) => setRecipeForm((prev: any) => ({ ...prev, title: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 font-saveful focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
              placeholder="Delicious Recipe"
            />
          </div>
          <div>
            <label className="mb-1 block font-saveful-semibold text-sm text-gray-700">Portions <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              value={recipeForm.portions}
              onChange={(e) => setRecipeForm((prev: any) => ({ ...prev, portions: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 font-saveful focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
              placeholder="Serves 4"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block font-saveful-semibold text-sm text-gray-700">Prep & Cook Time (minutes) <span className="text-red-500">*</span></label>
            <input
              type="number"
              required
              value={recipeForm.prepCookTime}
              onChange={(e) => setRecipeForm((prev: any) => ({ ...prev, prepCookTime: parseInt(e.target.value) || 0 }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 font-saveful focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
              placeholder="30"
            />
          </div>
          <div>
            <label className="mb-1 block font-saveful-semibold text-sm text-gray-700">YouTube ID</label>
            <input
              type="text"
              value={recipeForm.youtubeId || ""}
              onChange={(e) => setRecipeForm((prev: any) => ({ ...prev, youtubeId: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 font-saveful focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
              placeholder="NWuBJ4tphNM"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block font-saveful-semibold text-sm text-gray-700">Short Description <span className="text-red-500">*</span></label>
          <textarea
            required
            value={recipeForm.shortDescription}
            onChange={(e) => setRecipeForm((prev: any) => ({ ...prev, shortDescription: e.target.value }))}
            rows={2}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 font-saveful focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
          />
        </div>

        <div>
          <label className="mb-1 block font-saveful-semibold text-sm text-gray-700">Long Description</label>
          <textarea
            value={recipeForm.longDescription}
            onChange={(e) => setRecipeForm((prev: any) => ({ ...prev, longDescription: e.target.value }))}
            rows={4}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 font-saveful focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
          />
        </div>

        <div>
          <label className="mb-1 block font-saveful-semibold text-sm text-gray-700">
            Framework Categories <span className="text-red-500">*</span>
          </label>
          <div className="grid gap-2 md:grid-cols-3">
            {frameworkCategories && frameworkCategories.length > 0 ? frameworkCategories.map((cat: FwCategory) => (
              <label key={cat._id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={(recipeForm.frameworkCategories || []).includes(cat._id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setRecipeForm((prev: any) => ({
                        ...prev,
                        frameworkCategories: [...(prev.frameworkCategories || []), cat._id],
                      }));
                    } else {
                      setRecipeForm((prev: any) => ({
                        ...prev,
                        frameworkCategories: (prev.frameworkCategories || []).filter((id: string) => id !== cat._id),
                      }));
                    }
                  }}
                  className="rounded border-gray-300 text-saveful-green focus:ring-saveful-green"
                />
                <span className="font-saveful text-sm">{cat.title}</span>
              </label>
            )) : null}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block font-saveful-semibold text-sm text-gray-700">Sponsor</label>
            <select
              value={recipeForm.sponsorId || ""}
              onChange={(e) => setRecipeForm((prev: any) => ({ ...prev, sponsorId: e.target.value || undefined }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 font-saveful"
            >
              <option value="">None</option>
              {sponsors.map((s: Sponsor) => (
                <option key={s._id} value={s._id}>{s.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block font-saveful-semibold text-sm text-gray-700">Sticker</label>
            <select
              value={recipeForm.stickerId || ""}
              onChange={(e) => setRecipeForm((prev: any) => ({ ...prev, stickerId: e.target.value || undefined }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 font-saveful"
            >
              <option value="">None</option>
              {stickers.map((s: any) => (
                <option key={s._id || s.id} value={s._id || s.id}>{s.title}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block font-saveful-semibold text-sm text-gray-700">Fridge Keep Time</label>
            <input
              type="text"
              value={recipeForm.fridgeKeepTime || ""}
              onChange={(e) => setRecipeForm((prev: any) => ({ ...prev, fridgeKeepTime: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 font-saveful"
              placeholder="2 days"
            />
          </div>
          <div>
            <label className="mb-1 block font-saveful-semibold text-sm text-gray-700">Freeze Keep Time</label>
            <input
              type="text"
              value={recipeForm.freezeKeepTime || ""}
              onChange={(e) => setRecipeForm((prev: any) => ({ ...prev, freezeKeepTime: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 font-saveful"
              placeholder="1 month"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block font-saveful-semibold text-sm text-gray-700">Use Leftovers In</label>
          <div className="grid gap-2 md:grid-cols-3">
            {recipes && recipes.length > 0 ? recipes.map((rec: Recipe) => (
              <label key={rec._id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={(recipeForm.useLeftoversIn || []).includes(rec._id)}
                  onChange={(e) => {
                    setRecipeForm((prev: any) => ({
                      ...prev,
                      useLeftoversIn: e.target.checked
                        ? [...(prev.useLeftoversIn || []), rec._id]
                        : (prev.useLeftoversIn || []).filter((id: string) => id !== rec._id),
                    }));
                  }}
                  className="rounded border-gray-300 text-saveful-green focus:ring-saveful-green"
                />
                <span className="font-saveful text-sm">{rec.title}</span>
              </label>
            )) : null}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block font-saveful-semibold text-sm text-gray-700">Hero Image</label>
            <input type="file" accept="image/*" onChange={handleImageChange} />
            {heroImagePreview && (
              <img src={heroImagePreview} alt="Hero" className="mt-2 h-40 w-full object-cover rounded" />
            )}
          </div>
          <div>
            <label className="mb-1 block font-saveful-semibold text-sm text-gray-700">Order</label>
            <input
              type="number"
              value={(recipeForm as any).order ?? ""}
              onChange={(e) => setRecipeForm((prev: any) => ({ ...prev, order: e.target.value === "" ? undefined : parseInt(e.target.value) || 0 }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 font-saveful"
              placeholder="e.g., 1"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block font-saveful-semibold text-sm text-gray-700">Recipe Hacks/Tips</label>
          <div className="grid gap-2 md:grid-cols-3">
            {hackOrTips && hackOrTips.length > 0 ? hackOrTips.map((hack: HackOrTip) => (
              <label key={hack._id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={(recipeForm.hackOrTipIds || []).includes(hack._id)}
                  onChange={(e) => {
                    setRecipeForm((prev: any) => ({
                      ...prev,
                      hackOrTipIds: e.target.checked
                        ? [...(prev.hackOrTipIds || []), hack._id]
                        : (prev.hackOrTipIds || []).filter((id: string) => id !== hack._id),
                    }));
                  }}
                  className="rounded border-gray-300 text-saveful-green focus:ring-saveful-green"
                />
                <span className="font-saveful text-sm">{hack.title}</span>
              </label>
            )) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!recipeForm.isActive}
            onChange={(e) => setRecipeForm((prev: any) => ({ ...prev, isActive: e.target.checked }))}
            className="rounded border-gray-300 text-saveful-green focus:ring-saveful-green"
          />
          <span className="font-saveful text-sm">Recipe is active</span>
        </div>
      </div>
    </div>
  );
}

function ComponentsCard({
  recipeForm,
  addComponentWrapper,
  updateComponentWrapper,
  removeComponentWrapper,
  moveComponentWrapper,
  addComponent,
  updateComponent,
  removeComponent,
  addRequiredIngredient,
  updateRequiredIngredient,
  removeRequiredIngredient,
  addAlternativeIngredient,
  addOptionalIngredient,
  addComponentStep,
  updateComponentStep,
  removeComponentStep,
  ingredients,
  hackOrTips,
}: any) {
  const [expandedWrappers, setExpandedWrappers] = useState<Record<number, boolean>>({});

  const toggleWrapper = (index: number) => {
    setExpandedWrappers((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-saveful-bold text-xl text-gray-900">Components</h2>
        <button
          type="button"
          onClick={addComponentWrapper}
          className="flex items-center gap-2 rounded-lg bg-saveful-green px-3 py-1.5 font-saveful-semibold text-white shadow-sm hover:bg-green-600"
        >
          <FontAwesomeIcon icon={faPlus} /> Add Component Group
        </button>
      </div>

      {recipeForm.components.length === 0 ? (
        <div className="rounded border border-dashed border-gray-300 p-4 text-center text-gray-600">
          No components added yet. Click "Add Component Group" to start.
        </div>
      ) : (
        <div className="space-y-4">
          {recipeForm.components.map((wrapper: RecipeComponentWrapper, wIndex: number) => (
            <ComponentWrapperEditor
              key={wIndex}
              wrapper={wrapper}
              wrapperIndex={wIndex}
              isExpanded={!!expandedWrappers[wIndex]}
              toggleWrapper={() => toggleWrapper(wIndex)}
              updateComponentWrapper={updateComponentWrapper}
              removeComponentWrapper={removeComponentWrapper}
              moveComponentWrapper={moveComponentWrapper}
              isFirst={wIndex === 0}
              isLast={wIndex === recipeForm.components.length - 1}
              addComponent={addComponent}
              updateComponent={updateComponent}
              removeComponent={removeComponent}
              addRequiredIngredient={addRequiredIngredient}
              updateRequiredIngredient={updateRequiredIngredient}
              removeRequiredIngredient={removeRequiredIngredient}
              addAlternativeIngredient={addAlternativeIngredient}
              addOptionalIngredient={addOptionalIngredient}
              addComponentStep={addComponentStep}
              updateComponentStep={updateComponentStep}
              removeComponentStep={removeComponentStep}
              ingredients={ingredients}
              hackOrTips={hackOrTips}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ComponentWrapperEditor({ wrapper, wrapperIndex, isExpanded, toggleWrapper, updateComponentWrapper, removeComponentWrapper, moveComponentWrapper, isFirst, isLast, addComponent, updateComponent, removeComponent, addRequiredIngredient, updateRequiredIngredient, removeRequiredIngredient, addAlternativeIngredient, addOptionalIngredient, addComponentStep, updateComponentStep, removeComponentStep, ingredients, hackOrTips }: any) {
  return (
    <div className="rounded-lg border border-gray-300 bg-gray-50">
      <div className="flex items-center justify-between p-3">
        <div className="font-saveful-bold text-gray-800">Component Group</div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => moveComponentWrapper(wrapperIndex, "up")} disabled={isFirst} className="rounded border px-2 py-1 disabled:opacity-50">
            <FontAwesomeIcon icon={faChevronUp} />
          </button>
          <button type="button" onClick={() => moveComponentWrapper(wrapperIndex, "down")} disabled={isLast} className="rounded border px-2 py-1 disabled:opacity-50">
            <FontAwesomeIcon icon={faChevronDown} />
          </button>
          <button type="button" onClick={() => removeComponentWrapper(wrapperIndex)} className="rounded border px-2 py-1 text-red-600">
            <FontAwesomeIcon icon={faTrash} />
          </button>
          <button type="button" onClick={toggleWrapper} className="rounded border px-2 py-1">
            {isExpanded ? "Collapse" : "Expand"}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-3 p-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-saveful-semibold">Prep Short Description</label>
              <input
                type="text"
                value={wrapper.prepShortDescription || ""}
                onChange={(e) => updateComponentWrapper(wrapperIndex, { prepShortDescription: e.target.value })}
                className="w-full rounded border px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-saveful-semibold">Variant Tags</label>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {(wrapper.variantTags || []).map((tag: string, idx: number) => (
                    <span
                      key={`${tag}-${idx}`}
                      className="inline-flex items-center gap-1 rounded-full bg-gray-200 px-2 py-1 text-xs font-saveful-semibold text-gray-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() =>
                          updateComponentWrapper(wrapperIndex, {
                            variantTags: (wrapper.variantTags || []).filter((t: string, i: number) => !(i === idx && t === tag)),
                          })
                        }
                        className="ml-1 text-gray-600 hover:text-gray-900"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id={`variant-tag-input-${wrapperIndex}`}
                    className="flex-1 rounded border px-3 py-2"
                    placeholder="Add variant tag"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const input = document.getElementById(`variant-tag-input-${wrapperIndex}`) as HTMLInputElement | null;
                        const val = (input?.value || "").trim();
                        if (val) {
                          updateComponentWrapper(wrapperIndex, { variantTags: [...(wrapper.variantTags || []), val] });
                          if (input) input.value = "";
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="rounded bg-gray-700 px-3 py-2 text-xs font-saveful-semibold text-white hover:bg-gray-800"
                    onClick={() => {
                      const input = document.getElementById(`variant-tag-input-${wrapperIndex}`) as HTMLInputElement | null;
                      const val = (input?.value || "").trim();
                      if (val) {
                        updateComponentWrapper(wrapperIndex, { variantTags: [...(wrapper.variantTags || []), val] });
                        if (input) input.value = "";
                      }
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-saveful-semibold">Prep Long Description</label>
            <textarea
              value={wrapper.prepLongDescription || ""}
              onChange={(e) => updateComponentWrapper(wrapperIndex, { prepLongDescription: e.target.value })}
              rows={3}
              className="w-full rounded border px-3 py-2"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!wrapper.stronglyRecommended}
              onChange={(e) => updateComponentWrapper(wrapperIndex, { stronglyRecommended: e.target.checked })}
            />
            <span className="text-sm">Strongly recommended</span>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-saveful-semibold">Choice Instructions</label>
              <input
                type="text"
                value={wrapper.choiceInstructions || ""}
                onChange={(e) => updateComponentWrapper(wrapperIndex, { choiceInstructions: e.target.value })}
                className="w-full rounded border px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-saveful-semibold">Button Text</label>
              <input
                type="text"
                value={wrapper.buttonText || ""}
                onChange={(e) => updateComponentWrapper(wrapperIndex, { buttonText: e.target.value })}
                className="w-full rounded border px-3 py-2"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="font-saveful-semibold">Components</div>
            <button type="button" onClick={() => addComponent(wrapperIndex)} className="rounded border px-3 py-1.5">
              <FontAwesomeIcon icon={faPlus} /> Add Component
            </button>
          </div>

          <div className="space-y-3">
            {(wrapper.component || []).map((component: Component, cIndex: number) => (
              <ComponentEditor
                key={cIndex}
                component={component}
                wrapperIndex={wrapperIndex}
                componentIndex={cIndex}
                updateComponent={updateComponent}
                removeComponent={removeComponent}
                addRequiredIngredient={addRequiredIngredient}
                updateRequiredIngredient={updateRequiredIngredient}
                removeRequiredIngredient={removeRequiredIngredient}
                addAlternativeIngredient={addAlternativeIngredient}
                addOptionalIngredient={addOptionalIngredient}
                addComponentStep={addComponentStep}
                updateComponentStep={updateComponentStep}
                removeComponentStep={removeComponentStep}
                ingredients={ingredients}
                hackOrTips={hackOrTips}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ComponentEditor({ component, wrapperIndex, componentIndex, updateComponent, removeComponent, addRequiredIngredient, updateRequiredIngredient, removeRequiredIngredient, addAlternativeIngredient, addOptionalIngredient, addComponentStep, updateComponentStep, removeComponentStep, ingredients, hackOrTips }: any) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="rounded border border-blue-300 bg-blue-50 p-3">
      <div className="flex items-center justify-between">
        <input
          type="text"
          value={component.componentTitle || ""}
          onChange={(e) => updateComponent(wrapperIndex, componentIndex, { componentTitle: e.target.value })}
          className="mr-3 w-full rounded border px-3 py-2"
          placeholder="Component title (e.g., Sauce)"
        />
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setExpanded((p) => !p)} className="rounded border px-2 py-1">
            {expanded ? "Collapse" : "Expand"}
          </button>
          <button type="button" onClick={() => removeComponent(wrapperIndex, componentIndex)} className="rounded border px-2 py-1 text-red-600">
            <FontAwesomeIcon icon={faTrash} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 space-y-3">
          <div>
            <label className="mb-1 block text-sm font-saveful-semibold">Component Instructions</label>
            <textarea
              value={component.componentInstructions || ""}
              onChange={(e) => updateComponent(wrapperIndex, componentIndex, { componentInstructions: e.target.value })}
              rows={3}
              className="w-full rounded border px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-saveful-semibold">Included In Variants</label>
            <input
              type="text"
              value={(component.includedInVariants || []).join(", ")}
              onChange={(e) => updateComponent(wrapperIndex, componentIndex, { includedInVariants: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
              className="w-full rounded border px-3 py-2"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-saveful-semibold">Required Ingredients</div>
              <button type="button" onClick={() => addRequiredIngredient(wrapperIndex, componentIndex)} className="rounded border px-3 py-1.5">
                <FontAwesomeIcon icon={faPlus} /> Add Required Ingredient
              </button>
            </div>
            <div className="space-y-2">
              {(component.requiredIngredients || []).map((ing: RequiredIngredient, iIndex: number) => (
                <RequiredIngredientEditor
                  key={iIndex}
                  ingredient={ing}
                  wrapperIndex={wrapperIndex}
                  componentIndex={componentIndex}
                  ingredientIndex={iIndex}
                  updateRequiredIngredient={updateRequiredIngredient}
                  removeRequiredIngredient={removeRequiredIngredient}
                  addAlternativeIngredient={addAlternativeIngredient}
                  ingredients={ingredients}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-saveful-semibold">Optional Ingredients</div>
              <button type="button" onClick={() => addOptionalIngredient(wrapperIndex, componentIndex)} className="rounded border px-3 py-1.5">
                <FontAwesomeIcon icon={faPlus} /> Add Optional Ingredient
              </button>
            </div>
            <div className="space-y-2">
              {(component.optionalIngredients || []).map((ing: OptionalIngredient, oIndex: number) => (
                <div key={oIndex} className="rounded border border-green-300 bg-white p-2">
                  <div className="grid gap-2 md:grid-cols-3">
                    <select
                      value={ing.ingredient || ""}
                      onChange={(e) => {
                        const updated = { ...ing, ingredient: e.target.value };
                        const list = (component.optionalIngredients || []).map((x: OptionalIngredient, i: number) => (i === oIndex ? updated : x));
                        updateComponent(wrapperIndex, componentIndex, { optionalIngredients: list });
                      }}
                      className="rounded border px-2 py-1"
                    >
                      <option value="">Select ingredient</option>
                      {ingredients.map((ingr: Ingredient) => (
                        <option key={ingr._id} value={ingr._id}>{ingr.name}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={ing.quantity}
                      onChange={(e) => {
                        const updated = { ...ing, quantity: e.target.value };
                        const list = (component.optionalIngredients || []).map((x: OptionalIngredient, i: number) => (i === oIndex ? updated : x));
                        updateComponent(wrapperIndex, componentIndex, { optionalIngredients: list });
                      }}
                      className="rounded border px-2 py-1"
                      placeholder="e.g., 1 cup"
                    />
                    <input
                      type="text"
                      value={ing.preparation}
                      onChange={(e) => {
                        const updated = { ...ing, preparation: e.target.value };
                        const list = (component.optionalIngredients || []).map((x: OptionalIngredient, i: number) => (i === oIndex ? updated : x));
                        updateComponent(wrapperIndex, componentIndex, { optionalIngredients: list });
                      }}
                      className="rounded border px-2 py-1"
                      placeholder="chopped, minced"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-saveful-semibold">Steps</div>
              <button type="button" onClick={() => addComponentStep(wrapperIndex, componentIndex)} className="rounded border px-3 py-1.5">
                <FontAwesomeIcon icon={faPlus} /> Add Step
              </button>
            </div>
            <div className="space-y-2">
              {(component.componentSteps || []).map((step: ComponentStep, sIndex: number) => (
                <ComponentStepEditor
                  key={sIndex}
                  step={step}
                  wrapperIndex={wrapperIndex}
                  componentIndex={componentIndex}
                  stepIndex={sIndex}
                  updateComponentStep={updateComponentStep}
                  removeComponentStep={removeComponentStep}
                  hackOrTips={hackOrTips}
                  ingredients={ingredients}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RequiredIngredientEditor({ ingredient, wrapperIndex, componentIndex, ingredientIndex, updateRequiredIngredient, removeRequiredIngredient, addAlternativeIngredient, ingredients }: any) {
  const removeAlternativeIngredient = (altIndex: number) => {
    const updatedAlternatives = (ingredient.alternativeIngredients || []).filter((_: any, i: number) => i !== altIndex);
    updateRequiredIngredient(wrapperIndex, componentIndex, ingredientIndex, { alternativeIngredients: updatedAlternatives });
  };

  const updateAlternativeIngredient = (altIndex: number, updates: any) => {
    const updatedAlternatives = (ingredient.alternativeIngredients || []).map((alt: any, i: number) => (i === altIndex ? { ...alt, ...updates } : alt));
    updateRequiredIngredient(wrapperIndex, componentIndex, ingredientIndex, { alternativeIngredients: updatedAlternatives });
  };

  return (
    <div className="rounded border border-green-400 bg-white p-2">
      <div className="grid gap-2 md:grid-cols-4">
        <select
          value={ingredient.recommendedIngredient || ""}
          onChange={(e) => updateRequiredIngredient(wrapperIndex, componentIndex, ingredientIndex, { recommendedIngredient: e.target.value })}
          className="rounded border px-2 py-1"
        >
          <option value="">Select ingredient</option>
          {ingredients.map((ing: Ingredient) => (
            <option key={ing._id} value={ing._id}>{ing.name}</option>
          ))}
        </select>
        <input
          type="text"
          value={ingredient.quantity}
          onChange={(e) => updateRequiredIngredient(wrapperIndex, componentIndex, ingredientIndex, { quantity: e.target.value })}
          className="rounded border px-2 py-1"
          placeholder="e.g., 2 tbsp"
        />
        <input
          type="text"
          value={ingredient.preparation}
          onChange={(e) => updateRequiredIngredient(wrapperIndex, componentIndex, ingredientIndex, { preparation: e.target.value })}
          className="rounded border px-2 py-1"
          placeholder="chopped, minced"
        />
        <button type="button" onClick={() => removeRequiredIngredient(wrapperIndex, componentIndex, ingredientIndex)} className="rounded border px-2 py-1 text-red-600">
          <FontAwesomeIcon icon={faTrash} /> Remove
        </button>
      </div>

      <div className="mt-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-saveful-semibold">Alternative Ingredients</div>
          <button type="button" onClick={() => addAlternativeIngredient(wrapperIndex, componentIndex, ingredientIndex)} className="rounded border px-2 py-1">
            <FontAwesomeIcon icon={faPlus} /> Add Alternative
          </button>
        </div>
        <div className="mt-2 space-y-2">
          {(ingredient.alternativeIngredients || []).map((alt: any, aIndex: number) => (
            <div key={aIndex} className="rounded border border-green-200 p-2">
              <div className="grid gap-2 md:grid-cols-5">
                <select
                  value={alt.ingredient || ""}
                  onChange={(e) => updateAlternativeIngredient(aIndex, { ingredient: e.target.value })}
                  className="rounded border px-2 py-1"
                >
                  <option value="">Alternative ingredient</option>
                  {ingredients.map((ing: Ingredient) => (
                    <option key={ing._id} value={ing._id}>{ing.name}</option>
                  ))}
                </select>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!alt.inheritQuantity}
                    onChange={(e) => updateAlternativeIngredient(aIndex, { inheritQuantity: e.target.checked })}
                  />
                  Inherit qty
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!alt.inheritPreparation}
                    onChange={(e) => updateAlternativeIngredient(aIndex, { inheritPreparation: e.target.checked })}
                  />
                  Inherit prep
                </label>
                <input
                  type="text"
                  value={alt.quantity || ""}
                  onChange={(e) => updateAlternativeIngredient(aIndex, { quantity: e.target.value })}
                  className="rounded border px-2 py-1"
                  placeholder="e.g., 1 cup"
                />
                <input
                  type="text"
                  value={alt.preparation || ""}
                  onChange={(e) => updateAlternativeIngredient(aIndex, { preparation: e.target.value })}
                  className="rounded border px-2 py-1"
                  placeholder="chopped, minced"
                />
              </div>
              <div className="mt-2 text-right">
                <button type="button" onClick={() => removeAlternativeIngredient(aIndex)} className="rounded border px-2 py-1 text-red-600">
                  <FontAwesomeIcon icon={faTrash} /> Remove Alternative
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ComponentStepEditor({ step, wrapperIndex, componentIndex, stepIndex, updateComponentStep, removeComponentStep, hackOrTips, ingredients }: any) {
  return (
    <div className="rounded border border-purple-300 bg-white p-2">
      <div>
        <label className="mb-1 block text-sm font-saveful-semibold">Step Instructions</label>
        <textarea
          value={step.stepInstructions || ""}
          onChange={(e) => updateComponentStep(wrapperIndex, componentIndex, stepIndex, { stepInstructions: e.target.value })}
          rows={3}
          className="w-full rounded border px-2 py-1"
          placeholder="Step instructions..."
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-saveful-semibold">Relevant Ingredients</label>
        <p className="mb-2 text-xs text-gray-500">
          This step will only show if the user selects one of the ingredients below. Leave this blank if you want it to show for all ingredients.
        </p>
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {(step.relevantIngredients || []).map((ingId: string, ingIdx: number) => {
              const ing = ingredients.find((i: Ingredient) => i._id === ingId);
              return ing ? (
                <span
                  key={`${ingId}-${ingIdx}`}
                  className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-saveful-semibold text-green-700"
                >
                  {ing.name}
                  <button
                    type="button"
                    onClick={() => {
                      updateComponentStep(wrapperIndex, componentIndex, stepIndex, {
                        relevantIngredients: (step.relevantIngredients || []).filter((id: string) => id !== ingId),
                      });
                    }}
                    className="ml-1 text-green-500 hover:text-green-700"
                  >
                    ×
                  </button>
                </span>
              ) : null;
            })}
          </div>
          <select
            value=""
            onChange={(e) => {
              if (e.target.value && !(step.relevantIngredients || []).includes(e.target.value)) {
                updateComponentStep(wrapperIndex, componentIndex, stepIndex, {
                  relevantIngredients: [...(step.relevantIngredients || []), e.target.value],
                });
              }
            }}
            className="w-full rounded border px-2 py-1 text-xs"
          >
            <option value="">Add relevant ingredient...</option>
            {ingredients && ingredients.length > 0 ? ingredients.map((ing: Ingredient) => (
              <option key={ing._id} value={ing._id}>{ing.name}</option>
            )) : null}
          </select>
        </div>
      </div>
      <div className="mt-2">
        <label className="mb-1 block text-sm font-saveful-semibold">Hack or Tip</label>
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {(step.hackOrTipIds || []).map((hackId: string, hackIdx: number) => {
              const hack = hackOrTips.find((h: HackOrTip) => h._id === hackId);
              return hack ? (
                <span
                  key={`${hackId}-${hackIdx}`}
                  className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-1 text-xs font-saveful-semibold text-purple-700"
                >
                  {hack.title}
                  <button
                    type="button"
                    onClick={() => {
                      updateComponentStep(wrapperIndex, componentIndex, stepIndex, {
                        hackOrTipIds: (step.hackOrTipIds || []).filter((id: string) => id !== hackId),
                      });
                    }}
                    className="ml-1 text-purple-500 hover:text-purple-700"
                  >
                    ×
                  </button>
                </span>
              ) : null;
            })}
          </div>
          <select
            value=""
            onChange={(e) => {
              if (e.target.value && !(step.hackOrTipIds || []).includes(e.target.value)) {
                updateComponentStep(wrapperIndex, componentIndex, stepIndex, {
                  hackOrTipIds: [...(step.hackOrTipIds || []), e.target.value],
                });
              }
            }}
            className="w-full rounded border px-2 py-1 text-xs"
          >
            <option value="">Add hack or tip...</option>
            {hackOrTips && hackOrTips.length > 0 ? hackOrTips.map((h: HackOrTip) => (
              <option key={h._id} value={h._id}>{h.title}</option>
            )) : null}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 flex items-center gap-2">
          <input
            type="checkbox"
            checked={step.alwaysShow || false}
            onChange={(e) =>
              updateComponentStep(wrapperIndex, componentIndex, stepIndex, { alwaysShow: e.target.checked })
            }
            className="rounded border-gray-300 text-saveful-green focus:ring-saveful-green"
          />
          <span className="text-sm font-saveful-semibold">Always Show</span>
        </label>
        <p className="ml-5 text-xs text-gray-500">
          If true, this step will always show, even if the user has selected no ingredients for this component. In most cases, leave this off.
        </p>
      </div>

      <div className="mt-2 text-right">
        <button type="button" onClick={() => removeComponentStep(wrapperIndex, componentIndex, stepIndex)} className="rounded border px-2 py-1 text-red-600">
          <FontAwesomeIcon icon={faTrash} /> Remove Step
        </button>
      </div>
    </div>
  );
}
