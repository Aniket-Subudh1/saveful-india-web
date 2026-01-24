import { authService } from "./authService";

export enum IngredientTheme {
  RED = "Red",
  PINK = "Pink",
  PURPLE = "Purple",
  GREEN = "Green",
  YELLOW = "Yellow",
  ORANGE = "Orange",
}

export enum Month {
  JANUARY = "January",
  FEBRUARY = "February",
  MARCH = "March",
  APRIL = "April",
  MAY = "May",
  JUNE = "June",
  JULY = "July",
  AUGUST = "August",
  SEPTEMBER = "September",
  OCTOBER = "October",
  NOVEMBER = "November",
  DECEMBER = "December",
}

export interface IngredientCategory {
  _id: string;
  id?: string;
  name: string;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DietCategory {
  _id: string;
  id?: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface HackOrTip {
  _id: string;
  title: string;
  type: string;
  shortDescription: string;
}

export interface Sponsor {
  _id: string;
  title: string;
  logo: string;
  logoBlackAndWhite?: string;
  broughtToYouBy?: string;
  tagline?: string;
}

export interface Sticker {
  _id: string;
  title: string;
  imageUrl: string;
  description?: string;
}

export interface Ingredient {
  _id: string;
  name: string;
  averageWeight: number;
  categoryId: string | IngredientCategory;
  suitableDiets: (string | DietCategory)[];
  hasPage: boolean;
  heroImageUrl?: string;
  theme?: IngredientTheme;
  parentIngredients: (string | Partial<Ingredient>)[];
  description?: string;
  sponsorId?: string | Sponsor;
  relatedHacks: (string | HackOrTip)[];
  inSeason: Month[];
  stickerId?: string | Sticker;
  isPantryItem: boolean;
  nutrition?: string;
  order?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIngredientDto {
  name: string;
  averageWeight: number;
  categoryId: string;
  suitableDiets?: string[];
  hasPage?: boolean;
  theme?: IngredientTheme;
  parentIngredients?: string[];
  description?: string;
  sponsorId?: string;
  relatedHacks?: string[];
  inSeason?: Month[];
  stickerId?: string;
  isPantryItem?: boolean;
  nutrition?: string;
  order?: number;
}

export interface UpdateIngredientDto {
  name?: string;
  averageWeight?: number;
  categoryId?: string;
  suitableDiets?: string[];
  hasPage?: boolean;
  theme?: IngredientTheme;
  parentIngredients?: string[];
  description?: string;
  sponsorId?: string;
  relatedHacks?: string[];
  inSeason?: Month[];
  stickerId?: string;
  isPantryItem?: boolean;
  nutrition?: string;
  order?: number;
}

class IngredientManagementService {
  private readonly baseURL = process.env.NEXT_PUBLIC_API_URL;

  // Category endpoints
  async getAllCategories(): Promise<IngredientCategory[]> {
    const response = await fetch(`${this.baseURL}/api/ingredients/category`, {
      cache: 'no-store',
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }
    
    return response.json();
  }

  async createIngredient(
    data: CreateIngredientDto,
    files?: { heroImage?: File }
  ): Promise<Ingredient> {
    const formData = new FormData();

    formData.append("name", data.name.trim());
    
    const avgWeight = Number(data.averageWeight);
    if (isNaN(avgWeight) || avgWeight <= 0) {
      throw new Error("Average weight must be a positive number");
    }
    formData.append("averageWeight", avgWeight.toString());
    
    formData.append("categoryId", data.categoryId);
    formData.append("hasPage", data.hasPage ? "true" : "false");

    if (data.suitableDiets && data.suitableDiets.length > 0) {
      formData.append("suitableDiets", JSON.stringify(data.suitableDiets));
    }

    if (data.hasPage) {
      if (files?.heroImage) {
        formData.append("heroImage", files.heroImage);
      }
      if (data.theme) formData.append("theme", data.theme);
      if (data.description) formData.append("description", data.description);
      if (data.nutrition) formData.append("nutrition", data.nutrition);

      if (data.parentIngredients && data.parentIngredients.length > 0) {
        formData.append(
          "parentIngredients",
          JSON.stringify(data.parentIngredients)
        );
      }
      if (data.sponsorId) formData.append("sponsorId", data.sponsorId);
      if (data.relatedHacks && data.relatedHacks.length > 0) {
        formData.append("relatedHacks", JSON.stringify(data.relatedHacks));
      }
      if (data.inSeason && data.inSeason.length > 0) {
        formData.append("inSeason", JSON.stringify(data.inSeason));
      }
      if (data.stickerId) formData.append("stickerId", data.stickerId);
      if (data.isPantryItem !== undefined) {
        formData.append("isPantryItem", data.isPantryItem ? "true" : "false");
      }
      
      // Only append order if it's a valid number and greater than 0
      if (data.order !== undefined && data.order !== null) {
        const orderNum = Number(data.order);
        if (!isNaN(orderNum) && orderNum >= 0) {
          formData.append("order", orderNum.toString());
        }
      }
    }

    const token = authService.getStoredToken("admin");
    if (!token) throw new Error("No authentication token");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    const response = await fetch(`${this.baseURL}/api/ingredients`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to create ingredient" }));
      throw new Error(error.message || "Failed to create ingredient");
    }

    return response.json();
  }

  async getAllIngredients(): Promise<Ingredient[]> {
    const response = await fetch(`${this.baseURL}/api/ingredients`, {
      cache: 'no-store',
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch ingredients');
    }
    
    return response.json();
  }

  async getIngredientById(id: string): Promise<Ingredient> {
    const response = await fetch(`${this.baseURL}/api/ingredients/${id}`, {
      cache: 'no-store',
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch ingredient');
    }
    
    return response.json();
  }

  async updateIngredient(
    id: string,
    data: UpdateIngredientDto,
    files?: { heroImage?: File }
  ): Promise<Ingredient> {
    const formData = new FormData();

    if (data.name) formData.append("name", data.name.trim());
    
    if (data.averageWeight !== undefined) {
      const avgWeight = Number(data.averageWeight);
      if (isNaN(avgWeight) || avgWeight <= 0) {
        throw new Error("Average weight must be a positive number");
      }
      formData.append("averageWeight", avgWeight.toString());
    }
    
    if (data.categoryId) formData.append("categoryId", data.categoryId);
    if (data.hasPage !== undefined) {
      formData.append("hasPage", data.hasPage ? "true" : "false");
    }

    if (data.suitableDiets !== undefined) {
      formData.append("suitableDiets", JSON.stringify(data.suitableDiets));
    }

    if (files?.heroImage) {
      formData.append("heroImage", files.heroImage);
    }

    if (data.theme !== undefined) formData.append("theme", data.theme);
    if (data.description !== undefined) {
      formData.append("description", data.description);
    }
    if (data.nutrition !== undefined) {
      formData.append("nutrition", data.nutrition);
    }

    if (data.parentIngredients !== undefined) {
      formData.append(
        "parentIngredients",
        JSON.stringify(data.parentIngredients)
      );
    }

    if (data.sponsorId !== undefined) {
      formData.append("sponsorId", data.sponsorId);
    }

    if (data.relatedHacks !== undefined) {
      formData.append("relatedHacks", JSON.stringify(data.relatedHacks));
    }

    if (data.inSeason !== undefined) {
      formData.append("inSeason", JSON.stringify(data.inSeason));
    }

    if (data.stickerId !== undefined) {
      formData.append("stickerId", data.stickerId);
    }

    if (data.isPantryItem !== undefined) {
      formData.append("isPantryItem", data.isPantryItem ? "true" : "false");
    }

    if (data.order !== undefined && data.order !== null) {
      const orderNum = Number(data.order);
      if (!isNaN(orderNum) && orderNum >= 0) {
        formData.append("order", orderNum.toString());
      }
    }

    const token = authService.getStoredToken("admin");
    if (!token) throw new Error("No authentication token");

    // Create abort controller with 2 minute timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutes

    const response = await fetch(`${this.baseURL}/api/ingredients/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to update ingredient" }));
      throw new Error(error.message || "Failed to update ingredient");
    }

    return response.json();
  }

  async deleteIngredient(id: string): Promise<{ message: string }> {
    const token = authService.getStoredToken("admin");
    if (!token) throw new Error("No authentication token");

    const response = await fetch(`${this.baseURL}/api/ingredients/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to delete ingredient" }));
      throw new Error(error.message || "Failed to delete ingredient");
    }

    return response.json();
  }
}

export const ingredientManagementService = new IngredientManagementService();