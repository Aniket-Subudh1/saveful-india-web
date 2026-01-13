import { authService } from "./authService";

export interface RatingTag {
  _id: string;
  name: string;
  order: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRatingTagDto {
  name: string;
  order: number;
  description?: string;
  isActive?: boolean;
}

export interface UpdateRatingTagDto {
  name?: string;
  order?: number;
  description?: string;
  isActive?: boolean;
}

class RatingTagManagementService {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  async getAllRatingTags(): Promise<RatingTag[]> {
    try {
      const token = authService.getStoredToken("admin");
      const response = await fetch(`${this.baseUrl}/api/rating-tags`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch rating tags");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching rating tags:", error);
      throw error;
    }
  }

  async getActiveRatingTags(): Promise<RatingTag[]> {
    try {
      const token = authService.getStoredToken("admin");
      const response = await fetch(`${this.baseUrl}/api/rating-tags/active`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch active rating tags");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching active rating tags:", error);
      throw error;
    }
  }

  async getRatingTagById(id: string): Promise<RatingTag> {
    try {
      const token = authService.getStoredToken("admin");
      const response = await fetch(`${this.baseUrl}/api/rating-tags/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch rating tag");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching rating tag:", error);
      throw error;
    }
  }

  async createRatingTag(data: CreateRatingTagDto): Promise<RatingTag> {
    try {
      const token = authService.getStoredToken("admin");
      const response = await fetch(`${this.baseUrl}/api/rating-tags`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create rating tag");
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating rating tag:", error);
      throw error;
    }
  }

  async updateRatingTag(
    id: string,
    data: UpdateRatingTagDto
  ): Promise<RatingTag> {
    try {
      const token = authService.getStoredToken("admin");
      const response = await fetch(`${this.baseUrl}/api/rating-tags/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update rating tag");
      }

      return await response.json();
    } catch (error) {
      console.error("Error updating rating tag:", error);
      throw error;
    }
  }

  async deleteRatingTag(id: string): Promise<void> {
    try {
      const token = authService.getStoredToken("admin");
      const response = await fetch(`${this.baseUrl}/api/rating-tags/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete rating tag");
      }
    } catch (error) {
      console.error("Error deleting rating tag:", error);
      throw error;
    }
  }
}

export const ratingTagManagementService = new RatingTagManagementService();
