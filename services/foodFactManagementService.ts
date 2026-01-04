import { authService } from "@/services/authService";
import { apiGet } from "@/lib/apiClient";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://0.0.0.0:3000";

export interface FoodFact {
  _id: string;
  title: string;
  sponsor?: {
    _id: string;
    title: string;
    logo: string;
  };
  relatedIngredient?: {
    _id: string;
    name: string;
  };
  factOrInsight?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFoodFactDto {
  title: string;
  sponsor?: string;
  relatedIngredient?: string;
  factOrInsight?: string;
}

export interface UpdateFoodFactDto {
  title?: string;
  sponsor?: string;
  relatedIngredient?: string;
  factOrInsight?: string;
}

export const foodFactManagementService = {
  async createFoodFact(data: CreateFoodFactDto): Promise<FoodFact> {
    try {
      const token = authService.getStoredToken("admin");
      if (!token) {
        throw new Error("No authentication token available");
      }

      const response = await fetch(`${API_BASE_URL}/api/food-facts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          error = { message: errorText || "Failed to create food fact" };
        }
        throw { response: { data: error, status: response.status } };
      }

      return response.json();
    } catch (error: any) {
      console.error("createFoodFact error:", error);
      throw error;
    }
  },

  async getAllFoodFacts(): Promise<FoodFact[]> {
    try {
      const response = await apiGet(`${API_BASE_URL}/api/food-facts`, "admin");

      if (!response.ok) {
        const errorText = await response.text();
        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          error = { message: errorText || "Failed to fetch food facts" };
        }
        throw { response: { data: error, status: response.status } };
      }

      return response.json();
    } catch (error: any) {
      console.error("getAllFoodFacts error:", error);
      throw error;
    }
  },

  async getFoodFactById(id: string): Promise<FoodFact> {
    try {
      const response = await apiGet(`${API_BASE_URL}/api/food-facts/${id}`, "admin");

      if (!response.ok) {
        const errorText = await response.text();
        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          error = { message: errorText || "Failed to fetch food fact" };
        }
        throw { response: { data: error, status: response.status } };
      }

      return response.json();
    } catch (error: any) {
      console.error("getFoodFactById error:", error);
      throw error;
    }
  },

  async updateFoodFact(id: string, data: UpdateFoodFactDto): Promise<FoodFact> {
    try {
      const token = authService.getStoredToken("admin");
      if (!token) {
        throw new Error("No authentication token available");
      }

      const response = await fetch(`${API_BASE_URL}/api/food-facts/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          error = { message: errorText || "Failed to update food fact" };
        }
        throw { response: { data: error, status: response.status } };
      }

      return response.json();
    } catch (error: any) {
      console.error("updateFoodFact error:", error);
      throw error;
    }
  },

  async deleteFoodFact(id: string): Promise<{ message: string; deletedId: string }> {
    try {
      const token = authService.getStoredToken("admin");
      if (!token) {
        throw new Error("No authentication token available");
      }

      const response = await fetch(`${API_BASE_URL}/api/food-facts/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          error = { message: errorText || "Failed to delete food fact" };
        }
        throw { response: { data: error, status: response.status } };
      }

      return response.json();
    } catch (error: any) {
      console.error("deleteFoodFact error:", error);
      throw error;
    }
  },
};
