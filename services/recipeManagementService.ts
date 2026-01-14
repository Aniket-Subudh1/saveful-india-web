import { apiGet, apiPost, apiPatch, apiDelete, apiClient } from "@/lib/apiClient";
import { authService } from "@/services/authService";


export interface AlternativeIngredient {
  ingredient: string;
  inheritQuantity?: boolean;
  inheritPreparation?: boolean;
  quantity?: string;
  preparation?: string;
}

export interface RequiredIngredient {
  recommendedIngredient: string;
  quantity: string;
  preparation: string;
  alternativeIngredients?: AlternativeIngredient[];
}

export interface OptionalIngredient {
  ingredient: string;
  quantity: string;
  preparation: string;
}

export interface ComponentStep {
  stepInstructions: string;
  hackOrTipIds?: string[];
  alwaysShow?: boolean;
  relevantIngredients?: string[];
}

export interface Component {
  componentTitle: string;
  componentInstructions?: string;
  includedInVariants?: string[];
  requiredIngredients?: RequiredIngredient[];
  optionalIngredients?: OptionalIngredient[];
  componentSteps?: ComponentStep[];
}

export interface RecipeComponentWrapper {
  prepShortDescription?: string;
  prepLongDescription?: string;
  variantTags?: string[];
  stronglyRecommended?: boolean;
  choiceInstructions?: string;
  buttonText?: string;
  component: Component[];
}

export interface Recipe {
  _id: string;
  title: string;
  shortDescription: string;
  longDescription: string;
  hackOrTipIds?: string[];
  heroImageUrl?: string;
  youtubeId?: string;
  portions: string;
  prepCookTime: number;
  stickerId?: string;
  frameworkCategories: string[];
  sponsorId?: string;
  fridgeKeepTime?: string;
  freezeKeepTime?: string;
  useLeftoversIn?: string[];
  components: RecipeComponentWrapper[];
  order?: number;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRecipeDto {
  title: string;
  shortDescription: string;
  longDescription: string;
  hackOrTipIds?: string[];
  heroImageUrl?: string;
  youtubeId?: string;
  portions: string;
  prepCookTime: number;
  stickerId?: string;
  frameworkCategories: string[];
  sponsorId?: string;
  fridgeKeepTime?: string;
  freezeKeepTime?: string;
  useLeftoversIn?: string[];
  components: RecipeComponentWrapper[];
  order?: number;
  isActive?: boolean;
}

export interface UpdateRecipeDto {
  title?: string;
  shortDescription?: string;
  longDescription?: string;
  hackOrTipIds?: string[];
  heroImageUrl?: string;
  youtubeId?: string;
  portions?: string;
  prepCookTime?: number;
  stickerId?: string;
  frameworkCategories?: string[];
  sponsorId?: string;
  fridgeKeepTime?: string;
  freezeKeepTime?: string;
  useLeftoversIn?: string[];
  components?: RecipeComponentWrapper[];
  order?: number;
  isActive?: boolean;
}

export interface FrameworkCategory {
  _id: string;
  name: string;
  heroImageUrl?: string;
  iconImageUrl?: string;
  createdAt: string;
  updatedAt: string;
}



class RecipeManagementService {
  private readonly API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  async getAllRecipes(): Promise<Recipe[]> {
    try {
      const response = await apiGet(
        `${this.API_BASE_URL}/api/api/recipe`,
        "admin"
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: "Failed to fetch recipes",
        }));
        throw { response: { data: error } };
      }

      return response.json();
    } catch (error: any) {
      console.error("Get all recipes error:", error);
      throw error;
    }
  }

  /**
   * Get recipes by framework category
   */
  async getRecipesByCategory(categoryId: string): Promise<Recipe[]> {
    try {
      const response = await apiGet(
        `${this.API_BASE_URL}/api/api/recipe/category/${categoryId}`,
        "admin"
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: "Failed to fetch recipes by category",
        }));
        throw { response: { data: error } };
      }

      return response.json();
    } catch (error: any) {
      console.error("Get recipes by category error:", error);
      throw error;
    }
  }

  /**
   * Get a single recipe by ID
   */
  async getRecipeById(recipeId: string): Promise<Recipe> {
    try {
      const response = await apiGet(
        `${this.API_BASE_URL}/api/api/recipe/${recipeId}`,
        "admin"
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: "Failed to fetch recipe",
        }));
        throw { response: { data: error } };
      }

      return response.json();
    } catch (error: any) {
      console.error("Get recipe by ID error:", error);
      throw error;
    }
  }

  /**
   * Create a new recipe
   */
  async createRecipe(
    data: CreateRecipeDto,
    heroImage?: File
  ): Promise<{ message: string; recipe: Recipe }> {
    try {
      const formData = new FormData();

      // Append all fields
      formData.append("title", data.title);
      formData.append("shortDescription", data.shortDescription);
      formData.append("longDescription", data.longDescription);
      formData.append("portions", data.portions);
      formData.append("prepCookTime", data.prepCookTime.toString());
      formData.append("frameworkCategories", JSON.stringify(data.frameworkCategories));
      formData.append("components", JSON.stringify(data.components));

      // Optional fields
      if (data.hackOrTipIds && data.hackOrTipIds.length > 0) {
        formData.append("hackOrTipIds", JSON.stringify(data.hackOrTipIds));
      }
      if (data.youtubeId) {
        formData.append("youtubeId", data.youtubeId);
      }
      if (data.stickerId) {
        formData.append("stickerId", data.stickerId);
      }
      if (data.sponsorId) {
        formData.append("sponsorId", data.sponsorId);
      }
      if (data.fridgeKeepTime) {
        formData.append("fridgeKeepTime", data.fridgeKeepTime);
      }
      if (data.freezeKeepTime) {
        formData.append("freezeKeepTime", data.freezeKeepTime);
      }
      if (data.useLeftoversIn && data.useLeftoversIn.length > 0) {
        formData.append("useLeftoversIn", JSON.stringify(data.useLeftoversIn));
      }
      if (data.order !== undefined) {
        formData.append("order", data.order.toString());
      }
      if (data.isActive !== undefined) {
        formData.append("isActive", data.isActive.toString());
      }

      // Append hero image if provided
      if (heroImage) {
        formData.append("heroImage", heroImage);
      }

      const token = authService.getStoredToken("admin");
      if (!token) {
        throw new Error("No authentication token available");
      }

      const response = await fetch(`${this.API_BASE_URL}/api/api/recipe`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          error = { message: errorText || "Failed to create recipe" };
        }
        throw { response: { data: error } };
      }

      const result = await response.json();
      return result;
    } catch (error: any) {
      console.error("Create recipe error:", error);
      throw error;
    }
  }

  /**
   * Update an existing recipe
   */
  async updateRecipe(
    recipeId: string,
    data: UpdateRecipeDto,
    heroImage?: File
  ): Promise<{ message: string; recipe: Recipe }> {
    try {
      const formData = new FormData();

      // Append fields if they exist
      if (data.title) formData.append("title", data.title);
      if (data.shortDescription) formData.append("shortDescription", data.shortDescription);
      if (data.longDescription) formData.append("longDescription", data.longDescription);
      if (data.portions) formData.append("portions", data.portions);
      if (data.prepCookTime !== undefined) formData.append("prepCookTime", data.prepCookTime.toString());
      if (data.frameworkCategories) formData.append("frameworkCategories", JSON.stringify(data.frameworkCategories));
      if (data.components) formData.append("components", JSON.stringify(data.components));
      if (data.hackOrTipIds !== undefined) formData.append("hackOrTipIds", JSON.stringify(data.hackOrTipIds));
      if (data.youtubeId !== undefined) formData.append("youtubeId", data.youtubeId);
      if (data.stickerId !== undefined) formData.append("stickerId", data.stickerId);
      if (data.sponsorId !== undefined) formData.append("sponsorId", data.sponsorId);
      if (data.fridgeKeepTime !== undefined) formData.append("fridgeKeepTime", data.fridgeKeepTime);
      if (data.freezeKeepTime !== undefined) formData.append("freezeKeepTime", data.freezeKeepTime);
      if (data.useLeftoversIn !== undefined) formData.append("useLeftoversIn", JSON.stringify(data.useLeftoversIn));
      if (data.order !== undefined) formData.append("order", data.order.toString());
      if (data.isActive !== undefined) formData.append("isActive", data.isActive.toString());

      // Append hero image if provided
      if (heroImage) {
        formData.append("heroImage", heroImage);
      }

      const token = authService.getStoredToken("admin");
      if (!token) {
        throw new Error("No authentication token available");
      }

      const response = await fetch(`${this.API_BASE_URL}/api/api/recipe/${recipeId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          error = { message: "Failed to update recipe" };
        }
        throw { response: { data: error } };
      }

      return response.json();
    } catch (error: any) {
      console.error("Update recipe error:", error);
      throw error;
    }
  }


  async deleteRecipe(recipeId: string): Promise<{ message: string }> {
    try {
      const response = await apiDelete(
        `${this.API_BASE_URL}/api/api/recipe/${recipeId}`,
        "admin"
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: "Failed to delete recipe",
        }));
        throw { response: { data: error } };
      }

      return response.json();
    } catch (error: any) {
      console.error("Delete recipe error:", error);
      throw error;
    }
  }
}

export const recipeManagementService = new RecipeManagementService();
