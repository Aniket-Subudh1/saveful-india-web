import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/apiClient";

export interface FrameworkCategory {
  _id: string;
  title: string;
  description?: string;
  order?: number;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFrameworkCategoryDto {
  title: string;
  description?: string;
}

export interface UpdateFrameworkCategoryDto {
  title?: string;
  description?: string;
  order?: number;
  isActive?: boolean;
}

class FrameworkCategoryManagementService {
  private readonly API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  async getAllCategories(): Promise<FrameworkCategory[]> {
    try {
      const response = await apiGet(
        `${this.API_BASE_URL}/api/api/framework-category`,
        "admin"
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: "Failed to fetch framework categories",
        }));
        throw { response: { data: error } };
      }

      return response.json();
    } catch (error: any) {
      console.error("Get framework categories error:", error);
      throw error;
    }
  }

  async getCategoryById(categoryId: string): Promise<FrameworkCategory> {
    try {
      const response = await apiGet(
        `${this.API_BASE_URL}/api/api/framework-category/${categoryId}`,
        "admin"
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: "Failed to fetch framework category",
        }));
        throw { response: { data: error } };
      }

      return response.json();
    } catch (error: any) {
      console.error("Get framework category error:", error);
      throw error;
    }
  }

  async createCategory(
    data: CreateFrameworkCategoryDto
  ): Promise<{ message: string; category: FrameworkCategory }> {
    try {
      const response = await apiPost(
        `${this.API_BASE_URL}/api/api/framework-category`,
        data,
        "admin"
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: "Failed to create framework category",
        }));
        throw { response: { data: error } };
      }

      return response.json();
    } catch (error: any) {
      console.error("Create framework category error:", error);
      throw error;
    }
  }

  async updateCategory(
    categoryId: string,
    data: UpdateFrameworkCategoryDto
  ): Promise<{ message: string; category: FrameworkCategory }> {
    try {
      const response = await apiPut(
        `${this.API_BASE_URL}/api/api/framework-category/${categoryId}`,
        data,
        "admin"
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: "Failed to update framework category",
        }));
        throw { response: { data: error } };
      }

      return response.json();
    } catch (error: any) {
      console.error("Update framework category error:", error);
      throw error;
    }
  }

  async deleteCategory(categoryId: string): Promise<{ message: string }> {
    try {
      const response = await apiDelete(
        `${this.API_BASE_URL}/api/api/framework-category/${categoryId}`,
        "admin"
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: "Failed to delete framework category",
        }));
        throw { response: { data: error } };
      }

      return response.json();
    } catch (error: any) {
      console.error("Delete framework category error:", error);
      throw error;
    }
  }
}

export const frameworkCategoryManagementService =
  new FrameworkCategoryManagementService();
