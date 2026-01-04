import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/apiClient";

export interface DietCategory {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDietCategoryDto {
  name: string;
}

export interface UpdateDietCategoryDto {
  name: string;
}

class DietaryManagementService {
  private readonly API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  // ============= DIET CATEGORIES =============

  async getAll(): Promise<DietCategory[]> {
    try {
      const response = await apiGet(
        `${this.API_BASE_URL}/api/diet`,
        "admin"
      );

      if (!response.ok) {
        let errorMessage = "Failed to fetch diet categories";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          const errorText = await response.text().catch(() => "");
          errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`;
        }
        
        console.error("API Error Response:", {
          status: response.status,
          statusText: response.statusText,
          message: errorMessage,
        });
        
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error: any) {
      console.error("Get all diet categories error:", error);
      throw error;
    }
  }

  async create(dto: CreateDietCategoryDto): Promise<void> {
    try {
      const response = await apiPost(
        `${this.API_BASE_URL}/api/diet`,
        { diets: [dto.name] },
        "admin"
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: "Failed to create diet category",
        }));
        throw new Error(error.message || "Failed to create diet category");
      }

      // Response is successful, no need to parse JSON
      return;
    } catch (error: any) {
      console.error("Create diet category error:", error);
      throw error;
    }
  }

  async update(id: string, dto: UpdateDietCategoryDto): Promise<DietCategory> {
    try {
      const response = await apiPatch(
        `${this.API_BASE_URL}/api/diet/${id}`,
        dto,
        "admin"
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: "Failed to update diet category",
        }));
        throw new Error(error.message || "Failed to update diet category");
      }

      return response.json();
    } catch (error: any) {
      console.error("Update diet category error:", error);
      throw error;
    }
  }

  async delete(id: string): Promise<{ message: string }> {
    try {
      const response = await apiDelete(
        `${this.API_BASE_URL}/api/diet/${id}`,
        "admin"
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: "Failed to delete diet category",
        }));
        throw new Error(error.message || "Failed to delete diet category");
      }

      return response.json();
    } catch (error: any) {
      console.error("Delete diet category error:", error);
      throw error;
    }
  }
}

export const dietaryManagementService = new DietaryManagementService();
