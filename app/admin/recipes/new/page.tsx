"use client";
import { useAuth, useCurrentUser } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import {Toaster,toast} from "sonner"
import {
  recipeManagementService,
  CreateRecipeDto,
  RecipeComponentWrapper,
  Component,
  RequiredIngredient,
  OptionalIngredient,
  ComponentStep,
  AlternativeIngredient,
} from "@/services/recipeManagementService";
import { frameworkCategoryManagementService, FrameworkCategory as FwCategory } from "@/services/frameworkCategoryManagementService";
import { hackOrTipManagementService, HackOrTip } from "@/services/hackOrTipManagementService";
import { sponsorManagementService, Sponsor } from "@/services/sponsorManagementService";
import { stickerManagementService, Sticker } from "@/services/stickerManagementService";
import { ingredientManagementService, Ingredient } from "@/services/ingredientManagementService";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getAdminSidebarLinks } from "@/config/sidebar";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faSave,
  faPlus,
  faTrash,
  faArrowUp,
  faArrowDown,
  faTimes,
  faUtensils,
  faChevronDown,
  faChevronUp,
  faHexagonNodes,
} from "@fortawesome/free-solid-svg-icons";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, ChefHat } from "lucide-react";
import { COUNTRIES } from "@/lib/countries";

// Define types outside component
type ModalState = "idle" | "loading" | "success"

interface RecipeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function NewRecipePage() {
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
    countries: [],
  });
  //for modal
const [prompt, setPrompt] = useState<string>("")
const [state, setState] = useState<ModalState>("idle")
const [missingSuggestions, setMissingSuggestions] = useState<{ ingredients: string[], hacksOrTips: string[] }>({ ingredients: [], hacksOrTips: [] })
const [open, setOpen] = useState<boolean>(false)
  const onOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
  }

  const handleSubmitGenerate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!prompt.trim()) return

    setState("loading")
    const session = localStorage.getItem("admin_user");
    var sessionid="";
    if(!session){
      sessionid=Math.random().toString(16).substring(2);
    }
    sessionid=JSON.parse(session || "").id;
    try {
      const response = await fetch("/api/ai/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
  "sessionId": `${sessionid}`,
  "messages": [
    {
      "role": "user",
      "content": `create a recipe for ${prompt}`
    }
  ]
}),
      })

      if (!response.ok) {
         toast.error("Failed to generate recipe")
        throw new Error("Failed to generate recipe")
       
      }

      const data = await response.json()
      setRecipeForm(data.data.recipe)
      setMissingSuggestions(data.data.missingSuggestions)
      setState("success");
    } catch (error) {
      toast.error("Error generating recipe")
      console.error("Error generating recipe:", error)
      setState("idle")
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
    resetModal()
  }

  const resetModal = () => {
    setPrompt("")
    setState("idle")
    setMissingSuggestions({ ingredients: [], hacksOrTips: [] })
    setRecipeForm({
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
  }
//end of modal
  const { isLoading } = useAuth("admin");
  const user = useCurrentUser("admin");
  const router = useRouter();

  // Data for dropdowns
  const [frameworkCategories, setFrameworkCategories] = useState<FwCategory[]>([]);
  const [hackOrTips, setHackOrTips] = useState<HackOrTip[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingData, setLoadingData] = useState(true);



  const [heroImage, setHeroImage] = useState<File | null>(null);
  const [heroImagePreview, setHeroImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && user) {
      fetchData();
    }
  }, [isLoading, user]);

  const fetchData = async () => {
    try {
      setLoadingData(true);
      const [categoriesData, hacksData, sponsorsData, stickersData, ingredientsData, recipesData] =
        await Promise.all([
          frameworkCategoryManagementService.getAllCategories(),
          hackOrTipManagementService.getAll(),
          sponsorManagementService.getAllSponsors(),
          stickerManagementService.getAll(),
          ingredientManagementService.getAllIngredients(),
          recipeManagementService.getAllRecipes(),
        ]);
      setFrameworkCategories(categoriesData);
      setHackOrTips(hacksData);
      setSponsors(sponsorsData);
      setStickers(stickersData);
      setIngredients(ingredientsData);
      setRecipes(recipesData);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      alert("Failed to load data. Please refresh the page.");
    } finally {
      setLoadingData(false);
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

      const reader = new FileReader();
      reader.onloadend = () => {
        setHeroImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setHeroImage(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Clean and validate the data before sending
      const cleanedRecipeForm: any = {
        ...recipeForm,
        // Ensure required fields are present
        title: recipeForm.title.trim(),
        shortDescription: recipeForm.shortDescription.trim(),
        longDescription: recipeForm.longDescription.trim(),
        portions: recipeForm.portions.trim(),
        prepCookTime: Number(recipeForm.prepCookTime),

        // Clean up top-level optional ObjectId fields
        sponsorId: recipeForm.sponsorId?.trim() || undefined,
        stickerId: recipeForm.stickerId?.trim() || undefined,
        youtubeId: recipeForm.youtubeId?.trim() || undefined,

        // Clean up top-level array fields
        frameworkCategories: recipeForm.frameworkCategories.filter(id => id && id.trim()),
        hackOrTipIds: (recipeForm as any).hackOrTipIds?.filter((id: string) => id && id.trim()) || undefined,
        useLeftoversIn: (recipeForm as any).useLeftoversIn?.filter((id: string) => id && id.trim()) || undefined,

        // Clean up storage time fields
        fridgeKeepTime: recipeForm.fridgeKeepTime?.trim() || undefined,
        freezeKeepTime: recipeForm.freezeKeepTime?.trim() || undefined,

        // Clean up order and isActive
        order: recipeForm.order !== undefined ? Number(recipeForm.order) : undefined,
        isActive: recipeForm.isActive !== undefined ? Boolean(recipeForm.isActive) : true,

        // Clean up components - this is the critical part
        components: recipeForm.components.map((wrapper) => ({
          prepShortDescription: wrapper.prepShortDescription?.trim() || undefined,
          prepLongDescription: wrapper.prepLongDescription?.trim() || undefined,
          variantTags: (wrapper.variantTags || []).filter(tag => tag && tag.trim()),
          stronglyRecommended: Boolean(wrapper.stronglyRecommended),
          choiceInstructions: wrapper.choiceInstructions?.trim() || undefined,
          buttonText: wrapper.buttonText?.trim() || undefined,

          component: wrapper.component.map((comp) => ({
            componentTitle: comp.componentTitle.trim(),
            componentInstructions: comp.componentInstructions?.trim() || undefined,
            includedInVariants: (comp.includedInVariants || []).filter(v => v && v.trim()),

            requiredIngredients: (comp.requiredIngredients || [])
              .filter((ing) => ing.recommendedIngredient && ing.recommendedIngredient.trim())
              .map((ing) => ({
                recommendedIngredient: ing.recommendedIngredient.trim(),
                quantity: ing.quantity.trim(),
                preparation: ing.preparation.trim(),
                alternativeIngredients: (ing.alternativeIngredients || [])
                  .filter((alt) => alt.ingredient && alt.ingredient.trim())
                  .map((alt) => ({
                    ingredient: alt.ingredient.trim(),
                    inheritQuantity: Boolean(alt.inheritQuantity),
                    inheritPreparation: Boolean(alt.inheritPreparation),
                    quantity: alt.quantity?.trim() || undefined,
                    preparation: alt.preparation?.trim() || undefined,
                  })),
              })),

            optionalIngredients: (comp.optionalIngredients || [])
              .filter((ing) => ing.ingredient && ing.ingredient.trim())
              .map((ing) => ({
                ingredient: ing.ingredient.trim(),
                quantity: ing.quantity.trim(),
                preparation: ing.preparation.trim(),
              })),

            componentSteps: (comp.componentSteps || [])
              .filter((step) => step.stepInstructions && step.stepInstructions.trim())
              .map((step) => ({
                stepInstructions: step.stepInstructions.trim(),
                hackOrTipIds: (step.hackOrTipIds || []).filter((id: string) => id && id.trim()),
                alwaysShow: Boolean(step.alwaysShow),
                relevantIngredients: (step.relevantIngredients || []).filter((id: string) => id && id.trim()),
              })),
          })),
        })),
      };

      // Log the cleaned data for debugging
      console.log("=== Recipe Form Data (Cleaned) ===");
      console.log("Title:", cleanedRecipeForm.title);
      console.log("Components count:", cleanedRecipeForm.components.length);

      cleanedRecipeForm.components.forEach((wrapper: any, i: number) => {
        console.log(`\nWrapper ${i}:`, {
          componentCount: wrapper.component.length,
          variantTags: wrapper.variantTags,
          stronglyRecommended: wrapper.stronglyRecommended,
          prepShortDescription: wrapper.prepShortDescription?.substring(0, 50),
        });

        wrapper.component.forEach((comp: any, j: number) => {
          console.log(`  Component ${j}:`, {
            title: comp.componentTitle,
            instructions: comp.componentInstructions?.substring(0, 50),
            requiredIngredients: comp.requiredIngredients?.length || 0,
            optionalIngredients: comp.optionalIngredients?.length || 0,
            steps: comp.componentSteps?.length || 0,
            includedInVariants: comp.includedInVariants,
          });

          // Log first required ingredient if exists
          if (comp.requiredIngredients && comp.requiredIngredients.length > 0) {
            console.log(`    First required ingredient:`, comp.requiredIngredients[0]);
          }

          // Log first step if exists
          if (comp.componentSteps && comp.componentSteps.length > 0) {
            console.log(`    First step:`, {
              instructions: comp.componentSteps[0].stepInstructions.substring(0, 50),
              alwaysShow: comp.componentSteps[0].alwaysShow,
            });
          }
        });
      });

      console.log("\nFull cleaned data:", JSON.stringify(cleanedRecipeForm, null, 2));

      const validationErrors: string[] = [];

      if (cleanedRecipeForm.components.length === 0) {
        validationErrors.push("At least one component wrapper is required");
      }

      cleanedRecipeForm.components.forEach((wrapper: RecipeComponentWrapper, wrapperIndex: number) => {
        if (wrapper.component.length === 0) {
          validationErrors.push(`Component wrapper ${wrapperIndex + 1} must have at least one component`);
        }

        wrapper.component.forEach((comp: Component, compIndex: number) => {
          if (!comp.componentTitle || comp.componentTitle.trim() === '') {
            validationErrors.push(`Component ${compIndex + 1} in wrapper ${wrapperIndex + 1} must have a title`);
          }

          // Check required ingredients have valid IDs
          (comp.requiredIngredients || []).forEach((ing: RequiredIngredient, ingIndex: number) => {
            if (!ing.recommendedIngredient || ing.recommendedIngredient.trim() === '') {
              validationErrors.push(
                `Required ingredient ${ingIndex + 1} in component ${compIndex + 1}, wrapper ${wrapperIndex + 1} must have a selected ingredient`
              );
            }
            if (!ing.quantity || ing.quantity.trim() === '') {
              validationErrors.push(
                `Required ingredient ${ingIndex + 1} in component ${compIndex + 1}, wrapper ${wrapperIndex + 1} must have a quantity`
              );
            }
            if (!ing.preparation || ing.preparation.trim() === '') {
              validationErrors.push(
                `Required ingredient ${ingIndex + 1} in component ${compIndex + 1}, wrapper ${wrapperIndex + 1} must have preparation instructions`
              );
            }

            // Check alternative ingredients
            (ing.alternativeIngredients || []).forEach((alt: AlternativeIngredient, altIndex: number) => {
              if (!alt.ingredient || alt.ingredient.trim() === '') {
                validationErrors.push(
                  `Alternative ingredient ${altIndex + 1} for required ingredient ${ingIndex + 1} in component ${compIndex + 1}, wrapper ${wrapperIndex + 1} must have a selected ingredient`
                );
              }
            });
          });

          // Check optional ingredients have valid IDs
          (comp.optionalIngredients || []).forEach((ing: OptionalIngredient, ingIndex: number) => {
            if (!ing.ingredient || ing.ingredient.trim() === '') {
              validationErrors.push(
                `Optional ingredient ${ingIndex + 1} in component ${compIndex + 1}, wrapper ${wrapperIndex + 1} must have a selected ingredient`
              );
            }
            if (!ing.quantity || ing.quantity.trim() === '') {
              validationErrors.push(
                `Optional ingredient ${ingIndex + 1} in component ${compIndex + 1}, wrapper ${wrapperIndex + 1} must have a quantity`
              );
            }
            if (!ing.preparation || ing.preparation.trim() === '') {
              validationErrors.push(
                `Optional ingredient ${ingIndex + 1} in component ${compIndex + 1}, wrapper ${wrapperIndex + 1} must have preparation instructions`
              );
            }
          });

          // Check component steps
          (comp.componentSteps || []).forEach((step: ComponentStep, stepIndex: number) => {
            if (!step.stepInstructions || step.stepInstructions.trim() === '') {
              validationErrors.push(
                `Step ${stepIndex + 1} in component ${compIndex + 1}, wrapper ${wrapperIndex + 1} must have instructions`
              );
            }
          });
        });
      });

      // Check framework categories
      if (cleanedRecipeForm.frameworkCategories.length === 0) {
        validationErrors.push("At least one framework category is required");
      }

      // Display validation errors if any
      if (validationErrors.length > 0) {
        alert("Please fix the following errors:\n\n" + validationErrors.join("\n"));
        setIsSubmitting(false);
        return;
      }

      await recipeManagementService.createRecipe(cleanedRecipeForm, heroImage || undefined);
      alert("Recipe created successfully!");
      router.push("/admin/recipes");
      router.refresh();
    } catch (error: any) {
      console.error("Error creating recipe:", error);
      console.error("Error response:", error?.response?.data);

      // Better error messaging
      let errorMessage = "Failed to create recipe";
      
      // Handle abort/timeout errors
      if (error?.name === 'AbortError') {
        errorMessage = "Request timeout: The recipe creation took too long (>2 minutes). This might be due to a large image or network issues. Please try again with a smaller image.";
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

  // ===== Component Wrapper Management =====
  const addComponentWrapper = () => {
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
  };

  const updateComponentWrapper = (index: number, updates: Partial<RecipeComponentWrapper>) => {
    setRecipeForm((prev) => ({
      ...prev,
      components: prev.components.map((wrapper, i) =>
        i === index ? { ...wrapper, ...updates } : wrapper
      ),
    }));
  };

  const removeComponentWrapper = (index: number) => {
    setRecipeForm((prev) => ({
      ...prev,
      components: prev.components.filter((_, i) => i !== index),
    }));
  };

  const moveComponentWrapper = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= recipeForm.components.length) return;

    setRecipeForm((prev) => {
      const newComponents = [...prev.components];
      [newComponents[index], newComponents[newIndex]] = [
        newComponents[newIndex],
        newComponents[index],
      ];
      return { ...prev, components: newComponents };
    });
  };

  // ===== Component Management =====
  const addComponent = (wrapperIndex: number) => {
    const newComponent: Component = {
      componentTitle: "",
      componentInstructions: "",
      includedInVariants: [],
      requiredIngredients: [],
      optionalIngredients: [],
      componentSteps: [],
    };
    updateComponentWrapper(wrapperIndex, {
      component: [...recipeForm.components[wrapperIndex].component, newComponent],
    });
  };

  const updateComponent = (wrapperIndex: number, componentIndex: number, updates: Partial<Component>) => {
    const updatedComponents = recipeForm.components[wrapperIndex].component.map((comp, i) =>
      i === componentIndex ? { ...comp, ...updates } : comp
    );
    updateComponentWrapper(wrapperIndex, { component: updatedComponents });
  };

  const removeComponent = (wrapperIndex: number, componentIndex: number) => {
    const updatedComponents = recipeForm.components[wrapperIndex].component.filter(
      (_, i) => i !== componentIndex
    );
    updateComponentWrapper(wrapperIndex, { component: updatedComponents });
  };

  // ===== Required Ingredient Management =====
  const addRequiredIngredient = (wrapperIndex: number, componentIndex: number) => {
    const newIngredient: RequiredIngredient = {
      recommendedIngredient: "",
      quantity: "",
      preparation: "",
      alternativeIngredients: [],
    };
    const component = recipeForm.components[wrapperIndex].component[componentIndex];
    updateComponent(wrapperIndex, componentIndex, {
      requiredIngredients: [...(component.requiredIngredients || []), newIngredient],
    });
  };

  const updateRequiredIngredient = (
    wrapperIndex: number,
    componentIndex: number,
    ingredientIndex: number,
    updates: Partial<RequiredIngredient>
  ) => {
    const component = recipeForm.components[wrapperIndex].component[componentIndex];
    const updatedIngredients = (component.requiredIngredients || []).map((ing, i) =>
      i === ingredientIndex ? { ...ing, ...updates } : ing
    );
    updateComponent(wrapperIndex, componentIndex, { requiredIngredients: updatedIngredients });
  };

  const removeRequiredIngredient = (wrapperIndex: number, componentIndex: number, ingredientIndex: number) => {
    const component = recipeForm.components[wrapperIndex].component[componentIndex];
    const updatedIngredients = (component.requiredIngredients || []).filter((_, i) => i !== ingredientIndex);
    updateComponent(wrapperIndex, componentIndex, { requiredIngredients: updatedIngredients });
  };

  // ===== Alternative Ingredient Management =====
  const addAlternativeIngredient = (
    wrapperIndex: number,
    componentIndex: number,
    requiredIngredientIndex: number
  ) => {
    const newAlt: AlternativeIngredient = {
      ingredient: "",
      inheritQuantity: false,
      inheritPreparation: false,
      quantity: "",
      preparation: "",
    };
    const component = recipeForm.components[wrapperIndex].component[componentIndex];
    const requiredIngredient = component.requiredIngredients?.[requiredIngredientIndex];
    if (requiredIngredient) {
      const updatedAlternatives = [...(requiredIngredient.alternativeIngredients || []), newAlt];
      updateRequiredIngredient(wrapperIndex, componentIndex, requiredIngredientIndex, {
        alternativeIngredients: updatedAlternatives,
      });
    }
  };

  // ===== Optional Ingredient Management =====
  const addOptionalIngredient = (wrapperIndex: number, componentIndex: number) => {
    const newIngredient: OptionalIngredient = {
      ingredient: "",
      quantity: "",
      preparation: "",
    };
    const component = recipeForm.components[wrapperIndex].component[componentIndex];
    updateComponent(wrapperIndex, componentIndex, {
      optionalIngredients: [...(component.optionalIngredients || []), newIngredient],
    });
  };

  // ===== Component Step Management =====
  const addComponentStep = (wrapperIndex: number, componentIndex: number) => {
    const newStep: ComponentStep = {
      stepInstructions: "",
      hackOrTipIds: [],
      alwaysShow: false,
      relevantIngredients: [],
    };
    const component = recipeForm.components[wrapperIndex].component[componentIndex];
    updateComponent(wrapperIndex, componentIndex, {
      componentSteps: [...(component.componentSteps || []), newStep],
    });
  };

  const updateComponentStep = (
    wrapperIndex: number,
    componentIndex: number,
    stepIndex: number,
    updates: Partial<ComponentStep>
  ) => {
    const component = recipeForm.components[wrapperIndex].component[componentIndex];
    const updatedSteps = (component.componentSteps || []).map((step, i) =>
      i === stepIndex ? { ...step, ...updates } : step
    );
    updateComponent(wrapperIndex, componentIndex, { componentSteps: updatedSteps });
  };

  const removeComponentStep = (wrapperIndex: number, componentIndex: number, stepIndex: number) => {
    const component = recipeForm.components[wrapperIndex].component[componentIndex];
    const updatedSteps = (component.componentSteps || []).filter((_, i) => i !== stepIndex);
    updateComponent(wrapperIndex, componentIndex, { componentSteps: updatedSteps });
  };

  if (isLoading || loadingData) {
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
      <Toaster position="top-right" richColors />
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md rounded-lg">
        {state === "idle" && (
          <>
            <DialogHeader className="text-center">
              <div className="flex justify-center mb-4">
                <ChefHat className="h-8 w-8 text-primary" />
              </div>
              <DialogTitle className="text-2xl font-semibold text-center">Ask SaveFul AI</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Tell me what kind of recipe you&apos;d like to create
              </p>

              <form onSubmit={handleSubmitGenerate} className="space-y-4">
                <Input
                  placeholder="e.g., A quick pasta recipe with tomatoes..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  // @ts-ignore
                  disabled={state === "loading"}
                  className="border-border focus:ring-primary"
                />

                <div className="flex gap-3">
                   {/* @ts-ignore */}
                  <Button type="submit" disabled={!prompt.trim() || state === "loading"} className="flex-1">
                    Generate
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                     // @ts-ignore
                    disabled={state === "loading"}
                    className="flex-1 bg-transparent"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </>
        )}

        {state === "loading" && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-center text-sm font-medium">We are generating recipes for you...</p>
          </div>
        )}

        {state === "success" && (
  <div className="flex flex-col items-center justify-center py-8 space-y-4">
    <div className="rounded-full bg-green-100 dark:bg-green-900 p-3">
      <svg
        className="h-6 w-6 text-green-600 dark:text-green-200"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    </div>

    <p className="text-center text-sm font-medium">Recipe generated!</p>

    {(missingSuggestions.ingredients.length > 0 || missingSuggestions.hacksOrTips.length > 0) && (
      <div className="w-full space-y-4">
        {missingSuggestions.ingredients.length > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
            <h3 className="text-yellow-800 font-semibold mb-2">
              Missing Ingredients:
            </h3>
            <ul className="list-disc list-inside text-yellow-700">
              {missingSuggestions.ingredients.map((item:string, i:number) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {missingSuggestions.hacksOrTips.length > 0 && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <h3 className="text-blue-800 font-semibold mb-2">
              Suggested Hacks / Tips:
            </h3>
            <ul className="list-disc list-inside text-blue-700">
              {missingSuggestions.hacksOrTips.map((tip:string, i:number) => (
                <li key={i}>{tip}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )}

    <Button
      className="mt-4 w-full"
      onClick={() => onOpenChange(false)}
    >
      Close
    </Button>
  </div>
)}

      </DialogContent>
    </Dialog>
      <div className="relative h-full overflow-y-auto bg-gradient-to-br from-gray-50 via-saveful-cream/20 to-gray-50 p-4 md:p-8">
        <div className="pointer-events-none absolute right-0 top-0 opacity-5">
          <svg className="h-96 w-96" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path fill="#F59E0B" d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,79.6,-45.8C87.4,-32.6,90,-16.3,88.5,-0.9C87,14.6,81.4,29.2,72.8,41.7C64.2,54.2,52.6,64.6,39.1,71.8C25.6,79,10.2,83,-5.6,83.3C-21.4,83.6,-42.8,80.2,-58.3,71.2C-73.8,62.2,-83.4,47.6,-87.7,31.8C-92,16,-91,-1,-84.9,-16.2C-78.8,-31.4,-67.6,-44.8,-54.2,-52.4C-40.8,-60,-25.2,-61.8,-10.4,-64.8C4.4,-67.8,8.8,-72,44.7,-76.4Z" transform="translate(100 100)" />
          </svg>
        </div>

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
              <h1 className="font-saveful-bold text-3xl text-gray-900">Create New Recipe</h1>
              <p className="mt-1 font-saveful text-sm text-gray-600">
                Add a new recipe with ingredients and steps
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
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
              onOpenChange={onOpenChange}
            />

            {/* Components */}
            <ComponentsCard
              recipeForm={recipeForm}
              addComponentWrapper={addComponentWrapper}
              updateComponentWrapper={updateComponentWrapper}
              removeComponentWrapper={removeComponentWrapper}
              moveComponentWrapper={moveComponentWrapper}
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
                {isSubmitting ? "Creating..." : "Create Recipe"}
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
  onOpenChange,
}: any) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="mb-4 font-saveful-bold text-xl text-gray-900">Basic Information</h2>
        <button
          className=" rounded-lg bg-saveful-green px-4 py-2.5 font-saveful-semibold text-white shadow-md transition hover:bg-green-600 hover:shadow-lg disabled:bg-gray-300 disabled:shadow-none "
          onClick={() => onOpenChange(true)}
        >
          <FontAwesomeIcon icon={faHexagonNodes} className="mr-2" />
          Ask AI to Fill Details
        </button>
      </div>

      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block font-saveful-semibold text-sm text-gray-700">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={recipeForm.title}
              onChange={(e) => setRecipeForm((prev: any) => ({ ...prev, title: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 font-saveful focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
              placeholder="Enter recipe title"
            />
          </div>
          <div>
            <label className="mb-1 block font-saveful-semibold text-sm text-gray-700">
              Portions <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={recipeForm.portions}
              onChange={(e) => setRecipeForm((prev: any) => ({ ...prev, portions: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 font-saveful focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
              placeholder="e.g., 4 servings"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block font-saveful-semibold text-sm text-gray-700">
              Prep & Cook Time (minutes) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              value={recipeForm.prepCookTime}
              onChange={(e) =>
                setRecipeForm((prev: any) => ({ ...prev, prepCookTime: parseInt(e.target.value) || 0 }))
              }
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
          <label className="mb-1 block font-saveful-semibold text-sm text-gray-700">
            Short Description <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            value={recipeForm.shortDescription}
            onChange={(e) =>
              setRecipeForm((prev: any) => ({ ...prev, shortDescription: e.target.value }))
            }
            rows={2}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 font-saveful focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
            placeholder="Brief description"
          />
        </div>

        <div>
          <label className="mb-1 block font-saveful-semibold text-sm text-gray-700">
            Long Description <span className="text-red-500">*</span>
          </label>
          <RichTextEditor
            value={recipeForm.longDescription}
            onChange={(html) => setRecipeForm((prev: any) => ({ ...prev, longDescription: html }))}
            rows={6}
            placeholder="Detailed description..."
          />
        </div>

        <div>
          <label className="mb-1 block font-saveful-semibold text-sm text-gray-700">
            Framework Categories <span className="text-red-500">*</span>
          </label>
          <div className="grid gap-2 md:grid-cols-3">
            {frameworkCategories && frameworkCategories.length > 0 ? frameworkCategories.map((cat: any) => (
              <label key={cat._id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={recipeForm.frameworkCategories.includes(cat._id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setRecipeForm((prev: any) => ({
                        ...prev,
                        frameworkCategories: [...prev.frameworkCategories, cat._id],
                      }));
                    } else {
                      setRecipeForm((prev: any) => ({
                        ...prev,
                        frameworkCategories: prev.frameworkCategories.filter((id: string) => id !== cat._id),
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

        {/* Top-level Hacks/Tips */}
        <div>
          <label className="mb-1 block font-saveful-semibold text-sm text-gray-700">Recipe Hacks/Tips</label>
          <div className="grid gap-2 md:grid-cols-3">
            {hackOrTips && hackOrTips.length > 0 ? hackOrTips.map((hack: any) => (
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

        {/* Use Leftovers In */}
        <div>
          <label className="mb-1 block font-saveful-semibold text-sm text-gray-700">Use Leftovers In</label>
          <div className="grid gap-2 md:grid-cols-3">
            {recipes && recipes.length > 0 ? recipes.map((rec: any) => (
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

        {/* Available Countries */}
        <div>
          <label className="mb-1 block font-saveful-semibold text-sm text-gray-700">Available Countries</label>
          <p className="mb-2 text-xs text-gray-400">Select the countries where this recipe is available.</p>
          <div className="flex flex-wrap gap-2">
            {COUNTRIES.map((c) => {
              const checked = (recipeForm.countries || []).includes(c.name);
              return (
                <label key={c.code} className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm cursor-pointer ${checked ? 'border-saveful-green bg-saveful-green/5' : 'border-gray-200 bg-white'}`}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      setRecipeForm((prev: any) => ({
                        ...prev,
                        countries: e.target.checked
                          ? [...(prev.countries || []), c.name]
                          : (prev.countries || []).filter((x: string) => x !== c.name),
                      }));
                    }}
                    className="rounded border-gray-300 text-saveful-green focus:ring-saveful-green"
                  />
                  <span className="font-saveful text-sm">{c.name}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block font-saveful-semibold text-sm text-gray-700">Sponsor</label>
            <select
              value={recipeForm.sponsorId || ""}
              onChange={(e) => setRecipeForm((prev: any) => ({ ...prev, sponsorId: e.target.value || undefined }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 font-saveful focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
            >
              <option key="no-sponsor" value="">No Sponsor</option>
              {sponsors && sponsors.length > 0 ? sponsors.map((sponsor: any) => (
                <option key={sponsor._id} value={sponsor._id}>
                  {sponsor.title}
                </option>
              )) : null}
            </select>
          </div>
          <div>
            <label className="mb-1 block font-saveful-semibold text-sm text-gray-700">Sticker</label>
            <select
              value={recipeForm.stickerId || ""}
              onChange={(e) => setRecipeForm((prev: any) => ({ ...prev, stickerId: e.target.value || undefined }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 font-saveful focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
            >
              <option key="no-sticker" value="">No Sticker</option>
              {stickers && stickers.length > 0 ? stickers.map((sticker: any) => (
                <option key={sticker.id} value={sticker.id}>
                  {sticker.title}
                </option>
              )) : null}
            </select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block font-saveful-semibold text-sm text-gray-700">Fridge Keep Time</label>
            <input
              type="text"
              value={recipeForm.fridgeKeepTime || ""}
              onChange={(e) => setRecipeForm((prev: any) => ({ ...prev, fridgeKeepTime: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 font-saveful focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
              placeholder="Best eaten frozen."
            />
          </div>
          <div>
            <label className="mb-1 block font-saveful-semibold text-sm text-gray-700">Freeze Keep Time</label>
            <input
              type="text"
              value={recipeForm.freezeKeepTime || ""}
              onChange={(e) => setRecipeForm((prev: any) => ({ ...prev, freezeKeepTime: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 font-saveful focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
              placeholder="Store in an airtight container for up to 3 months."
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block font-saveful-semibold text-sm text-gray-700">Hero Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-saveful-green file:px-4 file:py-1 file:text-sm file:text-white hover:file:bg-green-600"
          />
          {heroImagePreview && (
            <div className="relative mt-2 h-40 w-full overflow-hidden rounded-lg">
              <Image src={heroImagePreview} alt="Preview" fill className="object-cover" />
            </div>
          )}
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
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-saveful-bold text-xl text-gray-900">Recipe Components</h2>
        <button
          type="button"
          onClick={addComponentWrapper}
          className="rounded-lg bg-saveful-green px-4 py-2 font-saveful-semibold text-sm text-white transition hover:bg-green-600"
        >
          <FontAwesomeIcon icon={faPlus} className="mr-1" />
          Add Component Wrapper
        </button>
      </div>

      {recipeForm.components.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
          <FontAwesomeIcon icon={faUtensils} className="mx-auto mb-3 h-12 w-12 text-gray-400" />
          <p className="font-saveful text-sm text-gray-500">
            No components added yet. Click "Add Component Wrapper" to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {recipeForm.components.map((wrapper: RecipeComponentWrapper, wrapperIndex: number) => (
            <ComponentWrapperEditor
              key={wrapperIndex}
              wrapper={wrapper}
              wrapperIndex={wrapperIndex}
              isExpanded={expandedWrappers[wrapperIndex]}
              toggleWrapper={toggleWrapper}
              updateComponentWrapper={updateComponentWrapper}
              removeComponentWrapper={removeComponentWrapper}
              moveComponentWrapper={moveComponentWrapper}
              isFirst={wrapperIndex === 0}
              isLast={wrapperIndex === recipeForm.components.length - 1}
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
      <div className="flex items-center justify-between border-b border-gray-300 bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => toggleWrapper(wrapperIndex)}
            className="text-gray-600 transition hover:text-gray-900"
          >
            <FontAwesomeIcon icon={isExpanded ? faChevronUp : faChevronDown} />
          </button>
          <span className="font-saveful-semibold text-gray-700">
            Component Wrapper {wrapperIndex + 1}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => moveComponentWrapper(wrapperIndex, "up")}
            disabled={isFirst}
            className="text-gray-500 transition hover:text-gray-700 disabled:opacity-30"
          >
            <FontAwesomeIcon icon={faArrowUp} />
          </button>
          <button
            type="button"
            onClick={() => moveComponentWrapper(wrapperIndex, "down")}
            disabled={isLast}
            className="text-gray-500 transition hover:text-gray-700 disabled:opacity-30"
          >
            <FontAwesomeIcon icon={faArrowDown} />
          </button>
          <button
            type="button"
            onClick={() => removeComponentWrapper(wrapperIndex)}
            className="text-red-500 transition hover:text-red-700"
          >
            <FontAwesomeIcon icon={faTrash} />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Wrapper fields */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block font-saveful-semibold text-sm text-gray-700">
                Prep Short Description
              </label>
              <input
                type="text"
                value={wrapper.prepShortDescription || ""}
                onChange={(e) =>
                  updateComponentWrapper(wrapperIndex, { prepShortDescription: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 font-saveful text-sm focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
                placeholder="You will need skewers or popsicle sticks."
              />
            </div>
            <div>
              <label className="mb-1 block font-saveful-semibold text-sm text-gray-700">
                Button Text
              </label>
              <input
                type="text"
                value={wrapper.buttonText || ""}
                onChange={(e) => updateComponentWrapper(wrapperIndex, { buttonText: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 font-saveful text-sm focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
                placeholder="add your veggies"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block font-saveful-semibold text-sm text-gray-700">
              Prep Long Description
            </label>
            <RichTextEditor
              value={wrapper.prepLongDescription || ""}
              onChange={(html) => updateComponentWrapper(wrapperIndex, { prepLongDescription: html })}
              rows={4}
              placeholder="Detailed prep instructions..."
            />
          </div>

          <div>
            <label className="mb-1 block font-saveful-semibold text-sm text-gray-700">
              Choice Instructions
            </label>
            <input
              type="text"
              value={wrapper.choiceInstructions || ""}
              onChange={(e) =>
                updateComponentWrapper(wrapperIndex, { choiceInstructions: e.target.value })
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 font-saveful text-sm focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
              placeholder="Choose at least 1"
            />
          </div>

          <div>
            <label className="mb-1 block font-saveful-semibold text-sm text-gray-700">
              Variant Tags
            </label>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {(wrapper.variantTags || []).map((tag: string, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1 rounded bg-saveful-green/10 px-2 py-1 font-saveful text-xs"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const newTags = (wrapper.variantTags || []).filter((_tag: string, i: number) => i !== idx);
                        updateComponentWrapper(wrapperIndex, {
                          variantTags: newTags,
                        });
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FontAwesomeIcon icon={faTimes} className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  id={`variant-tag-input-${wrapperIndex}`}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 font-saveful text-sm focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
                  placeholder="frozen yoghurt fruity ghosts"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const input = e.currentTarget;
                      const value = input.value.trim();
                      if (value) {
                        updateComponentWrapper(wrapperIndex, {
                          variantTags: [...(wrapper.variantTags || []), value],
                        });
                        input.value = '';
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const input = document.getElementById(`variant-tag-input-${wrapperIndex}`) as HTMLInputElement;
                    const value = input?.value.trim();
                    if (value) {
                      updateComponentWrapper(wrapperIndex, {
                        variantTags: [...(wrapper.variantTags || []), value],
                      });
                      input.value = '';
                    }
                  }}
                  className="rounded-lg bg-saveful-green px-4 py-2 font-saveful-semibold text-sm text-white transition hover:bg-green-600"
                >
                  <FontAwesomeIcon icon={faPlus} />
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={wrapper.stronglyRecommended || false}
                onChange={(e) =>
                  updateComponentWrapper(wrapperIndex, { stronglyRecommended: e.target.checked })
                }
                className="rounded border-gray-300 text-saveful-green focus:ring-saveful-green"
              />
              <span className="font-saveful text-sm">Strongly Recommended</span>
            </label>
          </div>

          {/* Components */}
          <div className="mt-4 border-t border-gray-300 pt-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="font-saveful-semibold text-gray-700">Components</h4>
              <button
                type="button"
                onClick={() => addComponent(wrapperIndex)}
                className="rounded bg-blue-500 px-3 py-1.5 font-saveful-semibold text-xs text-white transition hover:bg-blue-600"
              >
                <FontAwesomeIcon icon={faPlus} className="mr-1" />
                Add Component
              </button>
            </div>
            <div className="space-y-3">
              {wrapper.component.map((comp: Component, compIndex: number) => (
                <ComponentEditor
                  key={compIndex}
                  component={comp}
                  wrapperIndex={wrapperIndex}
                  componentIndex={compIndex}
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
        </div>
      )}
    </div>
  );
}

function ComponentEditor({ component, wrapperIndex, componentIndex, updateComponent, removeComponent, addRequiredIngredient, updateRequiredIngredient, removeRequiredIngredient, addAlternativeIngredient, addOptionalIngredient, addComponentStep, updateComponentStep, removeComponentStep, ingredients, hackOrTips }: any) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="rounded border border-blue-300 bg-blue-50 p-3">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-blue-600"
          >
            <FontAwesomeIcon icon={expanded ? faChevronUp : faChevronDown} />
          </button>
          <span className="font-saveful-semibold text-sm text-blue-700">
            Component {componentIndex + 1}: {component.componentTitle || "(Untitled)"}
          </span>
        </div>
        <button
          type="button"
          onClick={() => removeComponent(wrapperIndex, componentIndex)}
          className="text-red-500 transition hover:text-red-700"
        >
          <FontAwesomeIcon icon={faTrash} />
        </button>
      </div>

      {expanded && (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block font-saveful-semibold text-xs text-gray-700">
              Component Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={component.componentTitle}
              onChange={(e) =>
                updateComponent(wrapperIndex, componentIndex, { componentTitle: e.target.value })
              }
              className="w-full rounded border border-gray-300 px-2 py-1.5 font-saveful text-sm focus:border-saveful-green focus:outline-none focus:ring-1 focus:ring-saveful-green/20"
              placeholder="Fruit"
            />
          </div>

          <div>
            <label className="mb-1 block font-saveful-semibold text-xs text-gray-700">
              Component Instructions
            </label>
            <textarea
              value={component.componentInstructions || ""}
              onChange={(e) =>
                updateComponent(wrapperIndex, componentIndex, { componentInstructions: e.target.value })
              }
              rows={2}
              className="w-full rounded border border-gray-300 px-2 py-1.5 font-saveful text-sm focus:border-saveful-green focus:outline-none focus:ring-1 focus:ring-saveful-green/20"
              placeholder="Depending on your fruit, you are aiming for at least 6 pieces"
            />
          </div>

          <div>
            <label className="mb-1 block font-saveful-semibold text-xs text-gray-700">
              Included in Variants
            </label>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {(component.includedInVariants || []).map((variant: string, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1 rounded bg-saveful-green/10 px-2 py-1 font-saveful text-xs"
                  >
                    <span>{variant}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const newVariants = (component.includedInVariants || []).filter((_: string, i: number) => i !== idx);
                        updateComponent(wrapperIndex, componentIndex, {
                          includedInVariants: newVariants,
                        });
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FontAwesomeIcon icon={faTimes} className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  id={`variant-input-${wrapperIndex}-${componentIndex}`}
                  className="flex-1 rounded border border-gray-300 px-2 py-1.5 font-saveful text-sm focus:border-saveful-green focus:outline-none focus:ring-1 focus:ring-saveful-green/20"
                  placeholder="frozen yoghurt fruity ghosts"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const input = e.currentTarget;
                      const value = input.value.trim();
                      if (value) {
                        updateComponent(wrapperIndex, componentIndex, {
                          includedInVariants: [...(component.includedInVariants || []), value],
                        });
                        input.value = '';
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const input = document.getElementById(`variant-input-${wrapperIndex}-${componentIndex}`) as HTMLInputElement;
                    const value = input?.value.trim();
                    if (value) {
                      updateComponent(wrapperIndex, componentIndex, {
                        includedInVariants: [...(component.includedInVariants || []), value],
                      });
                      input.value = '';
                    }
                  }}
                  className="rounded bg-saveful-green px-3 py-1.5 font-saveful-semibold text-xs text-white transition hover:bg-green-600"
                >
                  <FontAwesomeIcon icon={faPlus} />
                </button>
              </div>
            </div>
          </div>

          {/* Required Ingredients */}
          <div className="rounded border border-green-300 bg-green-50 p-2">
            <div className="mb-2 flex items-center justify-between">
              <h5 className="font-saveful-semibold text-xs text-green-700">Required Ingredients</h5>
              <button
                type="button"
                onClick={() => addRequiredIngredient(wrapperIndex, componentIndex)}
                className="rounded bg-green-500 px-2 py-1 font-saveful-semibold text-xs text-white transition hover:bg-green-600"
              >
                <FontAwesomeIcon icon={faPlus} />
              </button>
            </div>
            <div className="space-y-2">
              {(component.requiredIngredients || []).map((reqIng: RequiredIngredient, reqIndex: number) => (
                <RequiredIngredientEditor
                  key={reqIndex}
                  ingredient={reqIng}
                  wrapperIndex={wrapperIndex}
                  componentIndex={componentIndex}
                  ingredientIndex={reqIndex}
                  updateRequiredIngredient={updateRequiredIngredient}
                  removeRequiredIngredient={removeRequiredIngredient}
                  addAlternativeIngredient={addAlternativeIngredient}
                  ingredients={ingredients}
                />
              ))}
            </div>
          </div>

          {/* Optional Ingredients */}
          <div className="rounded border border-yellow-300 bg-yellow-50 p-2">
            <div className="mb-2 flex items-center justify-between">
              <h5 className="font-saveful-semibold text-xs text-yellow-700">Optional Ingredients</h5>
              <button
                type="button"
                onClick={() => addOptionalIngredient(wrapperIndex, componentIndex)}
                className="rounded bg-yellow-500 px-2 py-1 font-saveful-semibold text-xs text-white transition hover:bg-yellow-600"
              >
                <FontAwesomeIcon icon={faPlus} />
              </button>
            </div>
            <div className="space-y-2">
              {(component.optionalIngredients || []).map((optIng: OptionalIngredient, optIndex: number) => (
                <div key={optIndex} className="rounded border border-yellow-400 bg-white p-2">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-saveful-semibold text-xs">Optional {optIndex + 1}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updatedOptional = (component.optionalIngredients || []).filter((_: any, i: number) => i !== optIndex);
                        updateComponent(wrapperIndex, componentIndex, {
                          optionalIngredients: updatedOptional,
                        });
                      }}
                      className="text-red-500 transition hover:text-red-700"
                    >
                      <FontAwesomeIcon icon={faTimes} className="text-xs" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <select
                      value={optIng.ingredient || ""}
                      onChange={(e) => {
                        const updatedOptional = (component.optionalIngredients || []).map((ing: any, i: number) =>
                          i === optIndex ? { ...ing, ingredient: e.target.value } : ing
                        );
                        updateComponent(wrapperIndex, componentIndex, {
                          optionalIngredients: updatedOptional,
                        });
                      }}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-xs focus:border-saveful-green focus:outline-none focus:ring-1 focus:ring-saveful-green/20"
                    >
                      <option value="">Select ingredient...</option>
                      {ingredients && ingredients.length > 0 ? ingredients.map((ing: Ingredient) => (
                        <option key={ing._id} value={ing._id}>
                          {ing.name}
                        </option>
                      )) : null}
                    </select>
                    <div className="grid gap-2 md:grid-cols-2">
                      <input
                        type="text"
                        value={optIng.quantity || ""}
                        onChange={(e) => {
                          const updatedOptional = (component.optionalIngredients || []).map((ing: any, i: number) =>
                            i === optIndex ? { ...ing, quantity: e.target.value } : ing
                          );
                          updateComponent(wrapperIndex, componentIndex, {
                            optionalIngredients: updatedOptional,
                          });
                        }}
                        className="w-full rounded border border-gray-300 px-2 py-1 text-xs focus:border-saveful-green focus:outline-none focus:ring-1 focus:ring-saveful-green/20"
                        placeholder="Quantity"
                      />
                      <input
                        type="text"
                        value={optIng.preparation || ""}
                        onChange={(e) => {
                          const updatedOptional = (component.optionalIngredients || []).map((ing: any, i: number) =>
                            i === optIndex ? { ...ing, preparation: e.target.value } : ing
                          );
                          updateComponent(wrapperIndex, componentIndex, {
                            optionalIngredients: updatedOptional,
                          });
                        }}
                        className="w-full rounded border border-gray-300 px-2 py-1 text-xs focus:border-saveful-green focus:outline-none focus:ring-1 focus:ring-saveful-green/20"
                        placeholder="Preparation"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Component Steps */}
          <div className="rounded border border-purple-300 bg-purple-50 p-2">
            <div className="mb-2 flex items-center justify-between">
              <h5 className="font-saveful-semibold text-xs text-purple-700">Component Steps</h5>
              <button
                type="button"
                onClick={() => addComponentStep(wrapperIndex, componentIndex)}
                className="rounded bg-purple-500 px-2 py-1 font-saveful-semibold text-xs text-white transition hover:bg-purple-600"
              >
                <FontAwesomeIcon icon={faPlus} />
              </button>
            </div>
            <div className="space-y-2">
              {(component.componentSteps || []).map((step: ComponentStep, stepIndex: number) => (
                <ComponentStepEditor
                  key={stepIndex}
                  step={step}
                  wrapperIndex={wrapperIndex}
                  componentIndex={componentIndex}
                  stepIndex={stepIndex}
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
    updateRequiredIngredient(wrapperIndex, componentIndex, ingredientIndex, {
      alternativeIngredients: updatedAlternatives,
    });
  };

  const updateAlternativeIngredient = (altIndex: number, updates: any) => {
    const updatedAlternatives = (ingredient.alternativeIngredients || []).map((alt: any, i: number) =>
      i === altIndex ? { ...alt, ...updates } : alt
    );
    updateRequiredIngredient(wrapperIndex, componentIndex, ingredientIndex, {
      alternativeIngredients: updatedAlternatives,
    });
  };
  return (
    <div className="rounded border border-green-400 bg-white p-2">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-saveful-semibold text-xs">Ingredient {ingredientIndex + 1}</span>
        <button
          type="button"
          onClick={() => removeRequiredIngredient(wrapperIndex, componentIndex, ingredientIndex)}
          className="text-red-500 transition hover:text-red-700"
        >
          <FontAwesomeIcon icon={faTimes} className="text-xs" />
        </button>
      </div>
      <div className="space-y-2">
        <select
          required
          value={ingredient.recommendedIngredient}
          onChange={(e) =>
            updateRequiredIngredient(wrapperIndex, componentIndex, ingredientIndex, {
              recommendedIngredient: e.target.value,
            })
          }
          className="w-full rounded border border-gray-300 px-2 py-1 text-xs focus:border-saveful-green focus:outline-none focus:ring-1 focus:ring-saveful-green/20"
        >
          <option key="select-ingredient" value="">Select ingredient...</option>
          {ingredients && ingredients.length > 0 ? ingredients.map((ing: Ingredient) => (
            <option key={ing._id} value={ing._id}>
              {ing.name}
            </option>
          )) : null}
        </select>
        <div className="grid gap-2 md:grid-cols-2">
          <input
            type="text"
            required
            value={ingredient.quantity}
            onChange={(e) =>
              updateRequiredIngredient(wrapperIndex, componentIndex, ingredientIndex, { quantity: e.target.value })
            }
            className="w-full rounded border border-gray-300 px-2 py-1 text-xs focus:border-saveful-green focus:outline-none focus:ring-1 focus:ring-saveful-green/20"
            placeholder="Quantity (e.g., 3)"
          />
          <input
            type="text"
            required
            value={ingredient.preparation}
            onChange={(e) =>
              updateRequiredIngredient(wrapperIndex, componentIndex, ingredientIndex, {
                preparation: e.target.value,
              })
            }
            className="w-full rounded border border-gray-300 px-2 py-1 text-xs focus:border-saveful-green focus:outline-none focus:ring-1 focus:ring-saveful-green/20"
            placeholder="Preparation (e.g., peeled and halved)"
          />
        </div>
        {(ingredient.alternativeIngredients || []).length > 0 && (
          <div className="space-y-2 rounded border border-gray-300 bg-gray-50 p-2">
            <div className="font-saveful-semibold text-xs text-gray-700">Alternative Ingredients:</div>
            {(ingredient.alternativeIngredients || []).map((alt: any, altIndex: number) => (
              <div key={altIndex} className="space-y-2 rounded border border-gray-400 bg-white p-2">
                <div className="flex items-center justify-between">
                  <span className="font-saveful-semibold text-xs">Alt {altIndex + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeAlternativeIngredient(altIndex)}
                    className="text-red-500 transition hover:text-red-700"
                  >
                    <FontAwesomeIcon icon={faTimes} className="text-xs" />
                  </button>
                </div>
                <select
                  value={alt.ingredient || ""}
                  onChange={(e) => updateAlternativeIngredient(altIndex, { ingredient: e.target.value })}
                  className="w-full rounded border border-gray-300 px-2 py-1 text-xs focus:border-saveful-green focus:outline-none focus:ring-1 focus:ring-saveful-green/20"
                >
                  <option value="">Select ingredient...</option>
                  {ingredients && ingredients.length > 0 ? ingredients.map((ing: Ingredient) => (
                    <option key={ing._id} value={ing._id}>
                      {ing.name}
                    </option>
                  )) : null}
                </select>
                <div className="grid gap-2 md:grid-cols-2">
                  <input
                    type="text"
                    value={alt.quantity || ""}
                    onChange={(e) => updateAlternativeIngredient(altIndex, { quantity: e.target.value })}
                    className="w-full rounded border border-gray-300 px-2 py-1 text-xs focus:border-saveful-green focus:outline-none focus:ring-1 focus:ring-saveful-green/20"
                    placeholder="Quantity"
                  />
                  <input
                    type="text"
                    value={alt.preparation || ""}
                    onChange={(e) => updateAlternativeIngredient(altIndex, { preparation: e.target.value })}
                    className="w-full rounded border border-gray-300 px-2 py-1 text-xs focus:border-saveful-green focus:outline-none focus:ring-1 focus:ring-saveful-green/20"
                    placeholder="Preparation"
                  />
                </div>
                <div className="flex gap-2">
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={alt.inheritQuantity || false}
                      onChange={(e) => updateAlternativeIngredient(altIndex, { inheritQuantity: e.target.checked })}
                      className="rounded border-gray-300 text-saveful-green focus:ring-saveful-green"
                    />
                    <span className="font-saveful text-xs">Inherit Quantity</span>
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={alt.inheritPreparation || false}
                      onChange={(e) => updateAlternativeIngredient(altIndex, { inheritPreparation: e.target.checked })}
                      className="rounded border-gray-300 text-saveful-green focus:ring-saveful-green"
                    />
                    <span className="font-saveful text-xs">Inherit Preparation</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => addAlternativeIngredient(wrapperIndex, componentIndex, ingredientIndex)}
          className="rounded bg-gray-500 px-2 py-1 font-saveful-semibold text-xs text-white transition hover:bg-gray-600"
        >
          <FontAwesomeIcon icon={faPlus} className="mr-1" />
          Alternative
        </button>
      </div>
      
    </div>
  );
}

function ComponentStepEditor({ step, wrapperIndex, componentIndex, stepIndex, updateComponentStep, removeComponentStep, hackOrTips, ingredients }: any) {
  return (
    <div className="rounded border border-purple-400 bg-white p-2">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-saveful-semibold text-xs">Step {stepIndex + 1}</span>
        <button
          type="button"
          onClick={() => removeComponentStep(wrapperIndex, componentIndex, stepIndex)}
          className="text-red-500 transition hover:text-red-700"
        >
          <FontAwesomeIcon icon={faTimes} className="text-xs" />
        </button>
      </div>
      <div className="space-y-2">
        <div>
          <label className="mb-1 block font-saveful-semibold text-xs text-gray-700">Step Instructions</label>
          <RichTextEditor
            value={step.stepInstructions}
            onChange={(html) =>
              updateComponentStep(wrapperIndex, componentIndex, stepIndex, { stepInstructions: html })
            }
            rows={3}
            placeholder="Step instructions..."
          />
        </div>

        <div>
          <label className="mb-1 block font-saveful-semibold text-xs text-gray-700">Hack or Tip</label>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {(step.hackOrTipIds || []).map((hackId: string, idx: number) => {
                const hack = hackOrTips?.find((h: any) => h._id === hackId);
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-1 rounded bg-blue-100 px-2 py-1 font-saveful text-xs"
                  >
                    <span>{hack?.title || hackId}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const newHacks = (step.hackOrTipIds || []).filter((_: string, i: number) => i !== idx);
                        updateComponentStep(wrapperIndex, componentIndex, stepIndex, {
                          hackOrTipIds: newHacks,
                        });
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FontAwesomeIcon icon={faTimes} className="h-3 w-3" />
                    </button>
                  </div>
                );
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
              className="w-full rounded border border-gray-300 px-2 py-1 text-xs focus:border-saveful-green focus:outline-none focus:ring-1 focus:ring-saveful-green/20"
            >
              <option value="">Add an entry</option>
              {hackOrTips && hackOrTips.length > 0 ? hackOrTips.map((hack: any) => (
                <option key={hack._id} value={hack._id}>
                  {hack.title}
                </option>
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
            <span className="font-saveful-semibold text-xs">Always Show</span>
          </label>
          <p className="ml-5 font-saveful text-xs text-gray-500">
            If true, this step will always show, even if the user has selected no ingredients for this component. In most cases, leave this off.
          </p>
        </div>

        <div>
          <label className="mb-1 block font-saveful-semibold text-xs text-gray-700">Relevant Ingredients</label>
          <p className="mb-2 font-saveful text-xs text-gray-500">
            This step will only show if the user selects one of the ingredients below. Leave this blank if you want it to show for all ingredients.
          </p>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {(step.relevantIngredients || []).map((ingId: string, idx: number) => {
                const ing = ingredients?.find((i: any) => i._id === ingId);
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-1 rounded bg-green-100 px-2 py-1 font-saveful text-xs"
                  >
                    <span>{ing?.name || ingId}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const newIngredients = (step.relevantIngredients || []).filter((_: string, i: number) => i !== idx);
                        updateComponentStep(wrapperIndex, componentIndex, stepIndex, {
                          relevantIngredients: newIngredients,
                        });
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FontAwesomeIcon icon={faTimes} className="h-3 w-3" />
                    </button>
                  </div>
                );
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
              className="w-full rounded border border-gray-300 px-2 py-1 text-xs focus:border-saveful-green focus:outline-none focus:ring-1 focus:ring-saveful-green/20"
            >
              <option value="">Add ingredient</option>
              {ingredients && ingredients.length > 0 ? ingredients.map((ing: Ingredient) => (
                <option key={ing._id} value={ing._id}>
                  {ing.name}
                </option>
              )) : null}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
