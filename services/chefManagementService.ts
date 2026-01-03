import { ChefCreateDto } from "@/types/auth";
import { apiGet, apiPost, apiDelete } from "@/lib/apiClient";

export interface Chef {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

class ChefManagementService {
  private readonly API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  async createChef(chefData: ChefCreateDto): Promise<{ success: boolean; message: string; chef: Chef }> {
    const response = await apiPost(
      `${this.API_BASE_URL}/api/auth/chef/create`,
      chefData,
      "admin"
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to create chef" }));
      throw { response: { data: error } };
    }

    return response.json();
  }

  async getAllChefs(): Promise<Chef[]> {
    const response = await apiGet(
      `${this.API_BASE_URL}/api/admin/chefs`,
      "admin"
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to fetch chefs" }));
      throw { response: { data: error } };
    }

    const data = await response.json();
    return data.chefs || [];
  }

  async getChefById(id: string): Promise<Chef> {
    const response = await apiGet(
      `${this.API_BASE_URL}/api/admin/chefs/${id}`,
      "admin"
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to fetch chef" }));
      throw { response: { data: error } };
    }

    const data = await response.json();
    return data.chef;
  }

  async deleteChef(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiDelete(
      `${this.API_BASE_URL}/api/admin/chefs/${id}`,
      "admin"
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to delete chef" }));
      throw { response: { data: error } };
    }

    return response.json();
  }
}

export const chefManagementService = new ChefManagementService();
