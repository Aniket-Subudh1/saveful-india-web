import { apiGet } from "@/lib/apiClient";

export type LeaderboardPeriod = "ALL_TIME" | "YEARLY" | "MONTHLY" | "WEEKLY";
export type LeaderboardMetric = "MEALS_COOKED" | "FOOD_SAVED" | "BOTH";

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  userEmail: string;
  country: string;
  stateCode: string;
  numberOfMealsCooked: number;
  foodSavedInGrams: number;
  foodSavedInKg: number;
  totalMoneySaved?: number;
  badgeCount: number;
  combinedScore?: number;
  updatedAt: string;
}

export interface LeaderboardResponse {
  period: LeaderboardPeriod;
  metric: LeaderboardMetric;
  limit: number;
  filters: {
    country: string;
    stateCode: string;
  };
  totalEntries: number;
  leaderboard: LeaderboardEntry[];
}

export interface UserRankResponse {
  found: boolean;
  rank?: number;
  totalUsers?: number;
  percentile?: string;
  userStats?: {
    mealsCooked: number;
    foodSaved: number;
    badgeCount: number;
  };
  surrounding?: {
    above: LeaderboardEntry[];
    current: LeaderboardEntry;
    below: LeaderboardEntry[];
  };
  period: LeaderboardPeriod;
  metric: LeaderboardMetric;
  message?: string;
}

export interface LeaderboardStatsResponse {
  totalActiveUsers: number;
  topAllTime: Array<{
    rank: number;
    userId: any;
    mealsCooked: number;
    foodSaved: string;
  }>;
  topMonthly: LeaderboardEntry[];
  topWeekly: LeaderboardEntry[];
}

export interface LeaderboardFilters {
  period?: LeaderboardPeriod;
  metric?: LeaderboardMetric;
  limit?: number;
  offset?: number;
  country?: string;
  stateCode?: string;
}

class LeaderboardService {
  private readonly API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  async getLeaderboard(filters: LeaderboardFilters = {}): Promise<LeaderboardResponse> {
    const queryParams = new URLSearchParams();
    
    if (filters.period) queryParams.append("period", filters.period);
    if (filters.metric) queryParams.append("metric", filters.metric);
    if (filters.limit) queryParams.append("limit", filters.limit.toString());
    if (filters.offset) queryParams.append("offset", filters.offset.toString());
    if (filters.country) queryParams.append("country", filters.country);
    if (filters.stateCode) queryParams.append("stateCode", filters.stateCode);

    const response = await apiGet(
      `${this.API_BASE_URL}/api/analytics/leaderboard?${queryParams.toString()}`,
      "admin"
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to fetch leaderboard" }));
      throw { response: { data: error } };
    }

    return response.json();
  }

  async getUserRank(
    userId: string,
    period: LeaderboardPeriod = "ALL_TIME",
    metric: LeaderboardMetric = "BOTH"
  ): Promise<UserRankResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append("period", period);
    queryParams.append("metric", metric);

    const response = await apiGet(
      `${this.API_BASE_URL}/api/analytics/leaderboard/my-rank?${queryParams.toString()}`,
      "admin"
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to fetch user rank" }));
      throw { response: { data: error } };
    }

    return response.json();
  }

  async getLeaderboardStats(): Promise<LeaderboardStatsResponse> {
    const response = await apiGet(
      `${this.API_BASE_URL}/api/analytics/leaderboard/stats`,
      "admin"
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to fetch leaderboard stats" }));
      throw { response: { data: error } };
    }

    return response.json();
  }
}

export const leaderboardService = new LeaderboardService();
