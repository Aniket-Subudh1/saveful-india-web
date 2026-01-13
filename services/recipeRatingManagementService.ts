import { authService } from "./authService";

export interface RecipeRating {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  recipeId: string;
  ratingTagId: {
    _id: string;
    name: string;
    order: number;
    description?: string;
  };
  review?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRecipeRatingDto {
  recipeId: string;
  ratingTagId: string;
  review?: string;
}

export interface UpdateRecipeRatingDto {
  ratingTagId?: string;
  review?: string;
}

export interface RecipeRatingStats {
  totalRatings: number;
  ratingBreakdown: Array<{ tagName: string; count: number; order: number }>;
  averageRatingOrder: number;
}

class RecipeRatingManagementService {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  async getAllRecipeRatings(): Promise<RecipeRating[]> {
    try {
      const token = authService.getStoredToken("admin");
      const response = await fetch(`${this.baseUrl}/api/recipe-ratings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch recipe ratings");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching recipe ratings:", error);
      throw error;
    }
  }

  async getRatingsByRecipe(recipeId: string): Promise<RecipeRating[]> {
    try {
      const token = authService.getStoredToken("admin");
      const response = await fetch(
        `${this.baseUrl}/api/recipe-ratings/recipe/${recipeId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch recipe ratings");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching recipe ratings:", error);
      throw error;
    }
  }

  async getRecipeRatingStats(recipeId: string): Promise<RecipeRatingStats> {
    try {
      const token = authService.getStoredToken("admin");
      const response = await fetch(
        `${this.baseUrl}/api/recipe-ratings/recipe/${recipeId}/stats`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch rating stats");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching rating stats:", error);
      throw error;
    }
  }

  async getRatingsByUser(userId: string): Promise<RecipeRating[]> {
    try {
      const token = authService.getStoredToken("admin");
      const response = await fetch(
        `${this.baseUrl}/api/recipe-ratings/user/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch user ratings");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching user ratings:", error);
      throw error;
    }
  }

  async getMyRatings(): Promise<RecipeRating[]> {
    try {
      const token = authService.getStoredToken("admin");
      const response = await fetch(
        `${this.baseUrl}/api/recipe-ratings/user/my-ratings`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch my ratings");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching my ratings:", error);
      throw error;
    }
  }

  async getRatingById(id: string): Promise<RecipeRating> {
    try {
      const token = authService.getStoredToken("admin");
      const response = await fetch(`${this.baseUrl}/api/recipe-ratings/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch recipe rating");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching recipe rating:", error);
      throw error;
    }
  }

  async createRecipeRating(data: CreateRecipeRatingDto): Promise<RecipeRating> {
    try {
      const token = authService.getStoredToken("admin");
      const response = await fetch(`${this.baseUrl}/api/recipe-ratings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create recipe rating");
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating recipe rating:", error);
      throw error;
    }
  }

  async updateRecipeRating(
    id: string,
    data: UpdateRecipeRatingDto
  ): Promise<RecipeRating> {
    try {
      const token = authService.getStoredToken("admin");
      const response = await fetch(`${this.baseUrl}/api/recipe-ratings/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update recipe rating");
      }

      return await response.json();
    } catch (error) {
      console.error("Error updating recipe rating:", error);
      throw error;
    }
  }

  async deleteRecipeRating(id: string): Promise<void> {
    try {
      const token = authService.getStoredToken("admin");
      const response = await fetch(`${this.baseUrl}/api/recipe-ratings/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete recipe rating");
      }
    } catch (error) {
      console.error("Error deleting recipe rating:", error);
      throw error;
    }
  }
}

export const recipeRatingManagementService =
  new RecipeRatingManagementService();
