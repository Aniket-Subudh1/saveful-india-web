import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/apiClient";
import { authService } from "@/services/authService";

export interface IngredientCategory {
  id: string;
  name: string;
  imageUrl?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Ingredient {
  id: string;
  name: string;
  slug: string;
  aliases: string[];
  imageUrl: string | null;
  description: string | null;
  nutritionInfo: string | null;
  categoryId: string | null;
  category?: IngredientCategory;
  isVeg: boolean;
  isVegan: boolean;
  isDairy: boolean;
  isNut: boolean;
  isGluten: boolean;
  hasPage: boolean | null;
  tags: string[];
  theme: string | null;
  inSeasonMonths: string[];
  isPantryItem: boolean;
  averageWeight: number | null;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIngredientCategoryDto {
  name: string;
  image?: File;
}

export interface CreateIngredientDto {
  name: string;
  aliases?: string[];
  description?: string;
  nutritionInfo?: string;
  categoryId?: string;
  isVeg?: boolean;
  isVegan?: boolean;
  isDairy?: boolean;
  isNut?: boolean;
  isGluten?: boolean;
  tags?: string[];
  hasPage?: boolean;
  heroImage?: File;
  theme?: string;
  inSeasonMonths?: string[];
  isPantryItem?: boolean;
  averageWeight?: number;
}

class IngredientManagementService {
  private readonly API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  // ============= CATEGORIES =============

  async getAllCategories(): Promise<IngredientCategory[]> {
    const response = await apiGet(
      `${this.API_BASE_URL}/api/ingredients/category`,
      "admin"
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: "Failed to fetch categories",
      }));
      throw { response: { data: error } };
    }

    return response.json();
  }

  async createCategory(
    dto: CreateIngredientCategoryDto
  ): Promise<IngredientCategory> {
    const formData = new FormData();
    formData.append("name", dto.name);
    
    if (dto.image) {
      formData.append("image", dto.image);
    }

    const token = authService.getStoredToken("admin");
    if (!token) {
      throw new Error("No authentication token available");
    }

    const response = await fetch(
      `${this.API_BASE_URL}/api/ingredients/category`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: "Failed to create category",
      }));
      throw { response: { data: error } };
    }

    return response.json();
  }

  async updateCategory(
    id: string,
    dto: CreateIngredientCategoryDto
  ): Promise<IngredientCategory> {
    const response = await apiPatch(
      `${this.API_BASE_URL}/api/ingredients/category/${id}`,
      dto,
      "admin"
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: "Failed to update category",
      }));
      throw { response: { data: error } };
    }

    return response.json();
  }

  async deleteCategory(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiDelete(
      `${this.API_BASE_URL}/api/ingredients/category/${id}`,
      "admin"
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: "Failed to delete category",
      }));
      throw { response: { data: error } };
    }

    return response.json();
  }

  // ============= INGREDIENTS =============

  async getAllIngredients(): Promise<Ingredient[]> {
    const response = await apiGet(
      `${this.API_BASE_URL}/api/ingredients`,
      "admin"
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: "Failed to fetch ingredients",
      }));
      throw { response: { data: error } };
    }

    const data = await response.json();
    return data.ingredients || [];
  }

  async getIngredientById(id: string): Promise<Ingredient> {
    const response = await apiGet(
      `${this.API_BASE_URL}/api/ingredients/${id}`,
      "admin"
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: "Failed to fetch ingredient",
      }));
      throw { response: { data: error } };
    }

    return response.json();
  }

  async createIngredient(dto: CreateIngredientDto): Promise<Ingredient> {
    console.log("=== CREATE INGREDIENT SERVICE ===");
    console.log("Input DTO:", dto);
    
    const formData = new FormData();

    // Add required fields
    formData.append("name", dto.name);

    // Add optional text fields
    if (dto.description) formData.append("description", dto.description);
    if (dto.nutritionInfo) formData.append("nutritionInfo", dto.nutritionInfo);
    if (dto.categoryId) formData.append("categoryId", dto.categoryId);
    if (dto.theme) formData.append("theme", dto.theme);

    // Add arrays
    if (dto.aliases && dto.aliases.length > 0) {
      formData.append("aliases", JSON.stringify(dto.aliases));
    }
    if (dto.tags && dto.tags.length > 0) {
      formData.append("tags", JSON.stringify(dto.tags));
    }
    if (dto.inSeasonMonths && dto.inSeasonMonths.length > 0) {
      formData.append("inSeasonMonths", JSON.stringify(dto.inSeasonMonths));
    }

    // Add numbers
    if (dto.averageWeight !== undefined && dto.averageWeight !== null) {
      formData.append("averageWeight", String(dto.averageWeight));
    }

    // CRITICAL: Boolean fields - ONLY send if explicitly true
    // This works with the backend's default of false
    if (dto.isVeg === true) formData.append("isVeg", "true");
    if (dto.isVegan === true) formData.append("isVegan", "true");
    if (dto.isDairy === true) formData.append("isDairy", "true");
    if (dto.isNut === true) formData.append("isNut", "true");
    if (dto.isGluten === true) formData.append("isGluten", "true");
    if (dto.hasPage === true) formData.append("hasPage", "true");
    if (dto.isPantryItem === true) formData.append("isPantryItem", "true");

    // Add image file
    if (dto.heroImage) {
      formData.append("image", dto.heroImage);
    }

    // Debug FormData
    console.log("=== FormData Contents ===");
    for (let [key, value] of formData.entries()) {
      console.log(`${key}: ${value instanceof File ? `[File: ${value.name}]` : value}`);
    }

    const token = authService.getStoredToken("admin");
    if (!token) {
      throw new Error("No authentication token available");
    }

    const response = await fetch(`${this.API_BASE_URL}/api/ingredients`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: "Failed to create ingredient",
      }));
      console.error("Create ingredient error:", error);
      throw { response: { data: error } };
    }

    const result = await response.json();
    console.log("Created ingredient:", result);
    return result;
  }

  async updateIngredient(
    id: string,
    dto: Partial<CreateIngredientDto>
  ): Promise<Ingredient> {
    console.log("=== UPDATE INGREDIENT SERVICE ===");
    console.log("Ingredient ID:", id);
    console.log("Input DTO:", dto);
    
    const formData = new FormData();

    // Add text fields (only if provided)
    if (dto.name) formData.append("name", dto.name);
    if (dto.description) formData.append("description", dto.description);
    if (dto.nutritionInfo) formData.append("nutritionInfo", dto.nutritionInfo);
    if (dto.categoryId) formData.append("categoryId", dto.categoryId);
    if (dto.theme) formData.append("theme", dto.theme);

    // Add arrays
    if (dto.aliases) formData.append("aliases", JSON.stringify(dto.aliases));
    if (dto.tags) formData.append("tags", JSON.stringify(dto.tags));
    if (dto.inSeasonMonths) {
      formData.append("inSeasonMonths", JSON.stringify(dto.inSeasonMonths));
    }

    // Add numbers
    if (dto.averageWeight !== undefined && dto.averageWeight !== null) {
      formData.append("averageWeight", String(dto.averageWeight));
    }

    // CRITICAL FIX: For updates, ALWAYS send all boolean values as strings
    // This ensures the backend receives and processes them correctly
    if (dto.isVeg !== undefined) {
      formData.append("isVeg", dto.isVeg ? "true" : "false");
    }
    if (dto.isVegan !== undefined) {
      formData.append("isVegan", dto.isVegan ? "true" : "false");
    }
    if (dto.isDairy !== undefined) {
      formData.append("isDairy", dto.isDairy ? "true" : "false");
    }
    if (dto.isNut !== undefined) {
      formData.append("isNut", dto.isNut ? "true" : "false");
    }
    if (dto.isGluten !== undefined) {
      formData.append("isGluten", dto.isGluten ? "true" : "false");
    }
    if (dto.hasPage !== undefined) {
      formData.append("hasPage", dto.hasPage ? "true" : "false");
    }
    if (dto.isPantryItem !== undefined) {
      formData.append("isPantryItem", dto.isPantryItem ? "true" : "false");
    }

    // Add image file
    if (dto.heroImage) {
      formData.append("image", dto.heroImage);
    }

    // Debug FormData
    console.log("=== Update FormData Contents ===");
    for (let [key, value] of formData.entries()) {
      console.log(`${key}: ${value instanceof File ? `[File: ${value.name}]` : value}`);
    }

    const token = authService.getStoredToken("admin");
    if (!token) {
      throw new Error("No authentication token available");
    }

    const response = await fetch(
      `${this.API_BASE_URL}/api/ingredients/${id}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: "Failed to update ingredient",
      }));
      console.error("Update ingredient error:", error);
      throw { response: { data: error } };
    }

    const result = await response.json();
    console.log("Updated ingredient:", result);
    return result;
  }

  async deleteIngredient(
    id: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await apiDelete(
      `${this.API_BASE_URL}/api/ingredients/${id}`,
      "admin"
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: "Failed to delete ingredient",
      }));
      throw { response: { data: error } };
    }

    return response.json();
  }

  async searchIngredients(query: string): Promise<Ingredient[]> {
    const response = await apiGet(
      `${this.API_BASE_URL}/api/ingredients?query=${encodeURIComponent(query)}`,
      "admin"
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: "Failed to search ingredients",
      }));
      throw { response: { data: error } };
    }

    const data = await response.json();
    return data.ingredients || [];
  }
}

export const ingredientManagementService = new IngredientManagementService();