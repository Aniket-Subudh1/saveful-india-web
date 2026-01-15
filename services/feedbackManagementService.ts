import { apiGet, apiDelete } from "@/lib/apiClient";

export interface FeedbackData {
  did_you_like_it?: boolean;
  food_saved?: number;
  meal_id?: string;
  rating?: number;
  review?: string;
}

export interface Feedback {
  _id: string;
  userId: string;
  framework_id: string;
  prompted: boolean;
  data: FeedbackData;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackWithDetails extends Feedback {
  user?: {
    name?: string;
    email?: string;
  };
  recipe?: {
    title?: string;
    heroImageUrl?: string;
  };
}

export interface FeedbackFilters {
  recipeId?: string;
  hasRating?: boolean;
  hasReview?: boolean;
  minRating?: number;
  maxRating?: number;
  startDate?: string;
  endDate?: string;
}

class FeedbackManagementService {
  private readonly API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  /**
   * Get all feedbacks with optional filters
   * @param filters - Optional filters to apply
   * @returns Promise<FeedbackWithDetails[]>
   */
  async getAllFeedbacks(filters?: FeedbackFilters): Promise<FeedbackWithDetails[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters?.recipeId) {
        params.append("framework_id", filters.recipeId);
      }
      if (filters?.hasRating !== undefined) {
        params.append("hasRating", filters.hasRating.toString());
      }
      if (filters?.hasReview !== undefined) {
        params.append("hasReview", filters.hasReview.toString());
      }
      if (filters?.minRating !== undefined) {
        params.append("minRating", filters.minRating.toString());
      }
      if (filters?.maxRating !== undefined) {
        params.append("maxRating", filters.maxRating.toString());
      }
      if (filters?.startDate) {
        params.append("startDate", filters.startDate);
      }
      if (filters?.endDate) {
        params.append("endDate", filters.endDate);
      }

      const queryString = params.toString();
      const url = queryString 
        ? `${this.API_BASE_URL}/api/feedback/admin/all?${queryString}` 
        : `${this.API_BASE_URL}/api/feedback/admin/all`;
      
      console.log('[FeedbackService] Fetching feedbacks from:', url);
      console.log('[FeedbackService] API_BASE_URL:', this.API_BASE_URL);
      
      const response = await apiGet(url, "admin");
      
      console.log('[FeedbackService] Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[FeedbackService] Error response:', errorText);
        const error = { message: errorText || "Failed to fetch feedbacks" };
        throw { response: { data: error } };
      }
      
      const data = await response.json();
      console.log('[FeedbackService] Received data:', data);
      return data.feedbacks || [];
    } catch (error: any) {
      console.error("Error fetching feedbacks:", error);
      throw error;
    }
  }

  /**
   * Get feedbacks for a specific recipe
   * @param recipeId - Recipe/Framework ID
   * @returns Promise<FeedbackWithDetails[]>
   */
  async getFeedbacksByRecipe(recipeId: string): Promise<FeedbackWithDetails[]> {
    try {
      const response = await apiGet(
        `${this.API_BASE_URL}/api/feedback/admin/recipe/${recipeId}`,
        "admin"
      );
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: "Failed to fetch feedbacks by recipe",
        }));
        throw { response: { data: error } };
      }
      
      const data = await response.json();
      return data.feedbacks || [];
    } catch (error: any) {
      console.error("Error fetching feedbacks by recipe:", error);
      throw error;
    }
  }

  /**
   * Get feedback statistics
   * @returns Promise with stats
   */
  async getFeedbackStats(): Promise<{
    totalFeedbacks: number;
    withRatings: number;
    withReviews: number;
    averageRating: number;
    ratingDistribution: { rating: number; count: number }[];
  }> {
    try {
      const response = await apiGet(
        `${this.API_BASE_URL}/api/feedback/admin/stats`,
        "admin"
      );
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: "Failed to fetch feedback stats",
        }));
        throw { response: { data: error } };
      }
      
      return await response.json();
    } catch (error: any) {
      console.error("Error fetching feedback stats:", error);
      throw error;
    }
  }

  /**
   * Delete a feedback
   * @param feedbackId - Feedback ID to delete
   */
  async deleteFeedback(feedbackId: string): Promise<void> {
    try {
      const url = `${this.API_BASE_URL}/api/feedback/admin/${feedbackId}`;
      console.log('[FeedbackService] Deleting feedback from:', url);
      
      const response = await apiDelete(url, "admin");
      
      console.log('[FeedbackService] Delete response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[FeedbackService] Delete error response:', errorText);
        const error = { message: errorText || "Failed to delete feedback" };
        throw { response: { data: error } };
      }
      
      console.log('[FeedbackService] Feedback deleted successfully');
    } catch (error: any) {
      console.error("Error deleting feedback:", error);
      throw error;
    }
  }

  /**
   * Get recipe rating summary
   * @param recipeId - Recipe ID
   * @returns Promise with rating stats for the recipe
   */
  async getRecipeRatingStats(recipeId: string): Promise<{
    averageRating: number;
    totalRatings: number;
    ratingDistribution: { rating: number; count: number }[];
  }> {
    try {
      const response = await apiGet(
        `${this.API_BASE_URL}/api/analytics/recipe-rating-stats?framework_id=${recipeId}`,
        "admin"
      );
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: "Failed to fetch recipe rating stats",
        }));
        throw { response: { data: error } };
      }
      
      return await response.json();
    } catch (error: any) {
      console.error("Error fetching recipe rating stats:", error);
      throw error;
    }
  }
}

export const feedbackManagementService = new FeedbackManagementService();
