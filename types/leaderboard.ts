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
  badgeCount: number;
  combinedScore?: number;
  updatedAt: string;
}

export interface LeaderboardStats {
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
