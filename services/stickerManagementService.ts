import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/apiClient";
import { authService } from "@/services/authService";

export interface Sticker {
  id: string;
  title: string;
  imageUrl: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStickerDto {
  title: string;
  description?: string;
  image?: File;
}

export interface UpdateStickerDto {
  title?: string;
  description?: string;
  image?: File;
}

class StickerManagementService {
  private readonly API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  // ============= STICKERS =============

  async getAll(): Promise<Sticker[]> {
    try {
      const response = await apiGet(
        `${this.API_BASE_URL}/api/sticker`,
        "admin"
      );

      if (!response.ok) {
        let errorMessage = "Failed to fetch stickers";
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
      console.error("Get all stickers error:", error);
      throw error;
    }
  }

  async create(dto: CreateStickerDto): Promise<Sticker> {
    try {
      const formData = new FormData();
      formData.append("title", dto.title);
      
      if (dto.description) {
        formData.append("description", dto.description);
      }

      if (dto.image) {
        formData.append("image", dto.image);
      }

      const token = authService.getStoredToken("admin");
      if (!token) {
        throw new Error("No authentication token available");
      }

      const response = await fetch(`${this.API_BASE_URL}/api/sticker`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: "Failed to create sticker",
        }));
        throw new Error(error.message || "Failed to create sticker");
      }

      return response.json();
    } catch (error: any) {
      console.error("Create sticker error:", error);
      throw error;
    }
  }

  async update(id: string, dto: UpdateStickerDto): Promise<Sticker> {
    try {
      const formData = new FormData();
      
      if (dto.title !== undefined) formData.append("title", dto.title);
      if (dto.description !== undefined) formData.append("description", dto.description);
      if (dto.image) formData.append("image", dto.image);

      const token = authService.getStoredToken("admin");
      if (!token) {
        throw new Error("No authentication token available");
      }

      const response = await fetch(
        `${this.API_BASE_URL}/api/sticker/${id}`,
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
          message: "Failed to update sticker",
        }));
        throw new Error(error.message || "Failed to update sticker");
      }

      return response.json();
    } catch (error: any) {
      console.error("Update sticker error:", error);
      throw error;
    }
  }

  async delete(id: string): Promise<{ message: string }> {
    try {
      const response = await apiDelete(
        `${this.API_BASE_URL}/api/sticker/${id}`,
        "admin"
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: "Failed to delete sticker",
        }));
        throw new Error(error.message || "Failed to delete sticker");
      }

      return response.json();
    } catch (error: any) {
      console.error("Delete sticker error:", error);
      throw error;
    }
  }
}

export const stickerManagementService = new StickerManagementService();
