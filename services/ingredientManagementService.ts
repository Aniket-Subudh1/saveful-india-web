import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/apiClient";
import { authService } from "@/services/authService";

export interface IngredientCategory {
  id: string;
  name: string;
  description: string | null;
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
  description: string;
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
      `${this.API_BASE_URL}/api/ingrediants/category`,
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
    const response = await apiPost(
      `${this.API_BASE_URL}/api/ingrediants/category`,
      dto,
      "admin"
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
      `${this.API_BASE_URL}/api/ingrediants/category/${id}`,
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
      `${this.API_BASE_URL}/api/ingrediants/category/${id}`,
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
      `${this.API_BASE_URL}/api/ingrediants`,
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
      `${this.API_BASE_URL}/api/ingrediants/${id}`,
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
    console.log("createIngredient called with DTO:", dto);
    
    const formData = new FormData();

    // Add all fields to FormData
    formData.append("name", dto.name);

    if (dto.aliases && dto.aliases.length > 0) {
      formData.append("aliases", JSON.stringify(dto.aliases));
    }

    if (dto.description) {
      formData.append("description", dto.description);
    }

    if (dto.nutritionInfo) {
      formData.append("nutritionInfo", dto.nutritionInfo);
    }

    if (dto.categoryId) {
      formData.append("categoryId", dto.categoryId);
    }

    formData.append("isVeg", String(dto.isVeg !== undefined ? dto.isVeg : false));
    formData.append("isVegan", String(dto.isVegan !== undefined ? dto.isVegan : false));
    formData.append("isDairy", String(dto.isDairy !== undefined ? dto.isDairy : false));
    formData.append("isNut", String(dto.isNut !== undefined ? dto.isNut : false));
    formData.append("isGluten", String(dto.isGluten !== undefined ? dto.isGluten : false));

    if (dto.hasPage !== undefined) {
      formData.append("hasPage", String(dto.hasPage));
    }

    if (dto.tags && dto.tags.length > 0) {
      formData.append("tags", JSON.stringify(dto.tags));
    }

    if (dto.theme) {
      formData.append("theme", dto.theme);
    }

    if (dto.inSeasonMonths && dto.inSeasonMonths.length > 0) {
      formData.append("inSeasonMonths", JSON.stringify(dto.inSeasonMonths));
    }

    if (dto.isPantryItem !== undefined) {
      formData.append("isPantryItem", String(dto.isPantryItem));
    }

    if (dto.averageWeight !== undefined) {
      formData.append("averageWeight", String(dto.averageWeight));
    }

    if (dto.heroImage) {
      formData.append("image", dto.heroImage);
    }

    // Debug FormData contents
    console.log("FormData contents:");
    for (let [key, value] of formData.entries()) {
      console.log(`${key}: ${value}`);
    }

    const token = authService.getStoredToken("admin");
    if (!token) {
      throw new Error("No authentication token available");
    }

    const response = await fetch(
      `${this.API_BASE_URL}/api/ingrediants`,
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
        message: "Failed to create ingredient",
      }));
      throw { response: { data: error } };
    }

    return response.json();
  }

  async updateIngredient(
    id: string,
    dto: Partial<CreateIngredientDto>
  ): Promise<Ingredient> {
    console.log("updateIngredient called with DTO:", dto);
    
    const formData = new FormData();

    if (dto.name) {
      formData.append("name", dto.name);
    }

    if (dto.aliases) {
      formData.append("aliases", JSON.stringify(dto.aliases));
    }

    if (dto.description) {
      formData.append("description", dto.description);
    }

    if (dto.nutritionInfo) {
      formData.append("nutritionInfo", dto.nutritionInfo);
    }

    if (dto.categoryId) {
      formData.append("categoryId", dto.categoryId);
    }

    if (dto.isVeg !== undefined) {
      formData.append("isVeg", String(dto.isVeg));
    }

    if (dto.isVegan !== undefined) {
      formData.append("isVegan", String(dto.isVegan));
    }

    if (dto.isDairy !== undefined) {
      formData.append("isDairy", String(dto.isDairy));
    }

    if (dto.isNut !== undefined) {
      formData.append("isNut", String(dto.isNut));
    }

    if (dto.isGluten !== undefined) {
      formData.append("isGluten", String(dto.isGluten));
    }

    if (dto.hasPage !== undefined) {
      formData.append("hasPage", String(dto.hasPage));
    }

    if (dto.tags) {
      formData.append("tags", JSON.stringify(dto.tags));
    }

    if (dto.theme) {
      formData.append("theme", dto.theme);
    }

    if (dto.inSeasonMonths) {
      formData.append("inSeasonMonths", JSON.stringify(dto.inSeasonMonths));
    }

    if (dto.isPantryItem !== undefined) {
      formData.append("isPantryItem", String(dto.isPantryItem));
    }

    if (dto.averageWeight !== undefined) {
      formData.append("averageWeight", String(dto.averageWeight));
    }

    if (dto.heroImage) {
      formData.append("image", dto.heroImage);
    }

    // Debug FormData contents
    console.log("Update FormData contents:");
    for (let [key, value] of formData.entries()) {
      console.log(`${key}: ${value}`);
    }

    const token = authService.getStoredToken("admin");
    if (!token) {
      throw new Error("No authentication token available");
    }

    const response = await fetch(
      `${this.API_BASE_URL}/api/ingrediants/${id}`,
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
      throw { response: { data: error } };
    }

    return response.json();
  }

  async deleteIngredient(
    id: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await apiDelete(
      `${this.API_BASE_URL}/api/ingrediants/${id}`,
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
      `${this.API_BASE_URL}/api/ingrediants?query=${encodeURIComponent(query)}`,
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
