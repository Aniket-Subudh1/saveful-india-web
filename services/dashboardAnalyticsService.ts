import { apiGet } from "@/lib/apiClient";

export interface DashboardStats {
  totalUsers: number;
  totalChefs: number;
  totalRecipes: number;
  totalIngredients: number;
  totalHacks: number;
  totalSponsors: number;
  totalFoodFacts: number;
  totalStickers: number;
  usersWithDietaryProfile: number;
  dietaryProfileCompletionRate: string;
  usersWithOnboarding: number;
  onboardingCompletionRate: string;
  recentUsers: RecentUser[];
  recentChefs: RecentChef[];
  userGrowth: GrowthData[];
  chefGrowth: GrowthData[];
  platformHealth: PlatformHealth;
  topIngredients: TopItem[];
  topHacks: TopItem[];
  activityLog: ActivityLogItem[];
}

export interface RecentUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface RecentChef {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface GrowthData {
  date: string;
  count: number;
}

export interface PlatformHealth {
  score: number;
  uptime: string;
  responseTime: string;
  activeUsers: number;
  serverLoad: string;
}

export interface TopItem {
  id: string;
  name: string;
  count: number;
}

export interface ActivityLogItem {
  id: string;
  type: "user" | "chef" | "recipe" | "ingredient" | "hack" | "sponsor";
  action: string;
  description: string;
  timestamp: string;
}

class DashboardAnalyticsService {
  private readonly API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  async getDashboardStats(): Promise<DashboardStats> {
    const response = await apiGet(
      `${this.API_BASE_URL}/api/admin/dashboard/stats`,
      "admin"
    );

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Failed to fetch dashboard stats" }));
      throw { response: { data: error } };
    }

    const data = await response.json();
    return data;
  }

  async getPlatformHealth(): Promise<PlatformHealth> {
    const response = await apiGet(
      `${this.API_BASE_URL}/api/admin/dashboard/health`,
      "admin"
    );

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Failed to fetch platform health" }));
      throw { response: { data: error } };
    }

    const data = await response.json();
    return data;
  }

  async getUserGrowth(days: number = 7): Promise<GrowthData[]> {
    const response = await apiGet(
      `${this.API_BASE_URL}/api/admin/dashboard/user-growth?days=${days}`,
      "admin"
    );

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Failed to fetch user growth data" }));
      throw { response: { data: error } };
    }

    const data = await response.json();
    return data.growth || [];
  }

  async getActivityLog(limit: number = 10): Promise<ActivityLogItem[]> {
    const response = await apiGet(
      `${this.API_BASE_URL}/api/admin/dashboard/activity?limit=${limit}`,
      "admin"
    );

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Failed to fetch activity log" }));
      throw { response: { data: error } };
    }

    const data = await response.json();
    return data.activities || [];
  }
}

export const dashboardAnalyticsService = new DashboardAnalyticsService();
