import { User, UserStats } from "@/types/user";
import { apiGet, apiDelete } from "@/lib/apiClient";

class UserManagementService {
  private readonly API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  async getAllUsers(): Promise<User[]> {
    const response = await apiGet(
      `${this.API_BASE_URL}/api/admin/users`,
      "admin"
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to fetch users" }));
      throw { response: { data: error } };
    }

    const data = await response.json();
    return data.users || [];
  }

  async getUserById(id: string): Promise<User> {
    const response = await apiGet(
      `${this.API_BASE_URL}/api/admin/users/${id}`,
      "admin"
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to fetch user" }));
      throw { response: { data: error } };
    }

    const data = await response.json();
    return data.user;
  }

  async deleteUser(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiDelete(
      `${this.API_BASE_URL}/api/admin/users/${id}`,
      "admin"
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to delete user" }));
      throw { response: { data: error } };
    }

    return response.json();
  }

  async getUserStats(): Promise<UserStats> {
    const response = await apiGet(
      `${this.API_BASE_URL}/api/admin/stats`,
      "admin"
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to fetch stats" }));
      throw { response: { data: error } };
    }

    return response.json();
  }
}

export const userManagementService = new UserManagementService();
