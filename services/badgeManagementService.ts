import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/apiClient";

export enum BadgeCategory {
  ONBOARDING = "ONBOARDING",
  USAGE = "USAGE",
  COOKING = "COOKING",
  MONEY_SAVED = "MONEY_SAVED",
  FOOD_SAVED = "FOOD_SAVED",
  PLANNING = "PLANNING",
  BONUS = "BONUS",
  SPONSOR = "SPONSOR",
  CHALLENGE_WINNER = "CHALLENGE_WINNER",
  SPECIAL = "SPECIAL",
}

export enum MilestoneType {
  FIRST_RECIPE_COOKED = "FIRST_RECIPE_COOKED",
  
  TOTAL_APP_SESSIONS_3 = "TOTAL_APP_SESSIONS_3",
  TOTAL_APP_SESSIONS_7 = "TOTAL_APP_SESSIONS_7",
  TOTAL_APP_SESSIONS_20 = "TOTAL_APP_SESSIONS_20",
  TOTAL_APP_SESSIONS_50 = "TOTAL_APP_SESSIONS_50",
  
  RECIPES_COOKED_5 = "RECIPES_COOKED_5",
  RECIPES_COOKED_10 = "RECIPES_COOKED_10",
  RECIPES_COOKED_25 = "RECIPES_COOKED_25",
  RECIPES_COOKED_50 = "RECIPES_COOKED_50",
  
  MONEY_SAVED_25 = "MONEY_SAVED_25",
  MONEY_SAVED_50 = "MONEY_SAVED_50",
  MONEY_SAVED_100 = "MONEY_SAVED_100",
  MONEY_SAVED_250 = "MONEY_SAVED_250",
  MONEY_SAVED_500 = "MONEY_SAVED_500",
  
  FIRST_FOOD_SAVED = "FIRST_FOOD_SAVED",
  FOOD_SAVED_5KG = "FOOD_SAVED_5KG",
  FOOD_SAVED_10KG = "FOOD_SAVED_10KG",
  FOOD_SAVED_15KG = "FOOD_SAVED_15KG",
  FOOD_SAVED_20KG = "FOOD_SAVED_20KG",
  
  SHOPPING_LIST_1 = "SHOPPING_LIST_1",
  SHOPPING_LIST_5 = "SHOPPING_LIST_5",
  SHOPPING_LIST_10 = "SHOPPING_LIST_10",
  SHOPPING_LIST_25 = "SHOPPING_LIST_25",
  
  WEEKDAY_MEALS_5 = "WEEKDAY_MEALS_5",
  
  COOKING_STREAK = "COOKING_STREAK",
  CHALLENGE_PARTICIPATION = "CHALLENGE_PARTICIPATION",
}

export enum MetricType {
  RECIPES_COOKED = "RECIPES_COOKED",
  APP_SESSIONS = "APP_SESSIONS",
  MONEY_SAVED_CUMULATIVE = "MONEY_SAVED_CUMULATIVE",
  FOOD_WEIGHT_SAVED = "FOOD_WEIGHT_SAVED",
  SHOPPING_LISTS_CREATED = "SHOPPING_LISTS_CREATED",
  WEEKDAY_MEALS_COOKED = "WEEKDAY_MEALS_COOKED",
  FIRST_EVENT = "FIRST_EVENT",
}

export interface SponsorMetadata {
  campaignId?: string;
  redemptionCode?: string;
  sponsorLink?: string;
  termsAndConditions?: string;
}

export interface Badge {
  _id: string;
  name: string;
  description: string;
  imageUrl: string;
  category: BadgeCategory;
  milestoneType?: MilestoneType;
  milestoneThreshold?: number;
  metricType?: MetricType;
  isActive: boolean;
  rarityScore: number;
  iconColor?: string;
  challengeId?: string;
  isSponsorBadge: boolean;
  sponsorName?: string;
  sponsorLogoUrl?: string;
  sponsorCountries?: string[];
  sponsorValidFrom?: string;
  sponsorValidUntil?: string;
  sponsorMetadata?: SponsorMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface UserBadge {
  _id: string;
  userId: string;
  badgeId: string;
  badge: Badge;
  earnedAt: string;
  achievedValue?: number;
  metadata?: {
    challengeId?: string;
    challengeName?: string;
    rank?: number;
    period?: string;
    metricType?: string;
    userCountry?: string;
    sponsorCampaignId?: string;
    totalParticipants?: number;
  };
  isNotified: boolean;
  isViewed: boolean;
  isFeatured: boolean;
}

export interface CreateBadgeDto {
  name: string;
  description: string;
  imageUrl?: string;
  category: BadgeCategory;
  milestoneType?: MilestoneType;
  milestoneThreshold?: number;
  metricType?: MetricType;
  rarityScore?: number;
  iconColor?: string;
  challengeId?: string;
  isActive?: boolean;
  isSponsorBadge?: boolean;
  sponsorName?: string;
  sponsorLogoUrl?: string;
  sponsorCountries?: string[];
  sponsorValidFrom?: string;
  sponsorValidUntil?: string;
  sponsorMetadata?: SponsorMetadata;
}

export interface UpdateBadgeDto {
  name?: string;
  description?: string;
  imageUrl?: string;
  category?: BadgeCategory;
  milestoneType?: MilestoneType;
  milestoneThreshold?: number;
  metricType?: MetricType;
  rarityScore?: number;
  iconColor?: string;
  challengeId?: string;
  isActive?: boolean;
  isDeleted?: boolean;
  isSponsorBadge?: boolean;
  sponsorName?: string;
  sponsorLogoUrl?: string;
  sponsorCountries?: string[];
  sponsorValidFrom?: string;
  sponsorValidUntil?: string;
  sponsorMetadata?: SponsorMetadata;
}

export interface BadgeStats {
  totalBadges: number;
  activeBadges: number;
  onboardingBadges: number;
  usageBadges: number;
  cookingBadges: number;
  moneySavedBadges: number;
  foodSavedBadges: number;
  planningBadges: number;
  bonusBadges: number;
  sponsorBadges: number;
  challengeBadges: number;
  specialBadges: number;
  totalAwarded: number;
  uniqueRecipients: number;
}

export interface BadgeProgress {
  badge: {
    _id: string;
    name: string;
    description: string;
    imageUrl: string;
    category: BadgeCategory;
  };
  current: number;
  target: number;
  percentage: number;
}

export interface UserBadgeStats {
  totalBadges: number;
  badgesByCategory: Record<string, number>;
  recentBadges: UserBadge[];
  unviewedCount: number;
  progressToNextBadges: BadgeProgress[];
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  userEmail?: string;
  badgeCount: number;
  latestBadge?: {
    awardedAt: string;
  };
}

class BadgeManagementService {
  private readonly API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  // ===========================
  // BADGE CRUD OPERATIONS
  // ===========================

  async getAllBadges(includeInactive: boolean = true): Promise<Badge[]> {
    const response = await apiGet(
      `${this.API_BASE_URL}/api/badges?includeInactive=${includeInactive}`,
      "admin"
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to fetch badges" }));
      throw { response: { data: error } };
    }

    const data = await response.json();
    return data.badges || [];
  }

  async getBadgesByCategory(category: BadgeCategory): Promise<Badge[]> {
    const response = await apiGet(
      `${this.API_BASE_URL}/api/badges/category/${category}`,
      "admin"
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to fetch badges by category" }));
      throw { response: { data: error } };
    }

    const data = await response.json();
    return data.badges || [];
  }

  async getSponsorBadges(country?: string): Promise<Badge[]> {
    const url = country 
      ? `${this.API_BASE_URL}/api/badges/sponsor?country=${country}`
      : `${this.API_BASE_URL}/api/badges/sponsor`;
      
    const response = await apiGet(url, "admin");

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to fetch sponsor badges" }));
      throw { response: { data: error } };
    }

    const data = await response.json();
    return data.badges || [];
  }

  async getBadgeById(id: string): Promise<Badge> {
    const response = await apiGet(
      `${this.API_BASE_URL}/api/badges/${id}`,
      "admin"
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to fetch badge" }));
      throw { response: { data: error } };
    }

    const data = await response.json();
    return data.badge;
  }

  async createBadge(badgeData: CreateBadgeDto, imageFile?: File, sponsorLogoFile?: File): Promise<Badge> {
    const formData = new FormData();
    formData.append('name', badgeData.name);
    formData.append('description', badgeData.description);
    formData.append('category', badgeData.category);
    
    if (badgeData.milestoneType) {
      formData.append('milestoneType', badgeData.milestoneType);
    }
    if (badgeData.milestoneThreshold !== undefined) {
      formData.append('milestoneThreshold', badgeData.milestoneThreshold.toString());
    }
    if (badgeData.metricType) {
      formData.append('metricType', badgeData.metricType);
    }
    if (badgeData.rarityScore !== undefined) {
      formData.append('rarityScore', badgeData.rarityScore.toString());
    }
    if (badgeData.iconColor) {
      formData.append('iconColor', badgeData.iconColor);
    }
    if (badgeData.challengeId) {
      formData.append('challengeId', badgeData.challengeId);
    }
    if (badgeData.isActive !== undefined) {
      formData.append('isActive', badgeData.isActive ? 'true' : 'false');
    }
    
    // Sponsor Badge Fields - Always send to ensure proper updates
    formData.append('isSponsorBadge', badgeData.isSponsorBadge ? 'true' : 'false');
    if (badgeData.sponsorName) {
      formData.append('sponsorName', badgeData.sponsorName);
    }
    if (badgeData.sponsorCountries && badgeData.sponsorCountries.length > 0) {
      formData.append('sponsorCountries', JSON.stringify(badgeData.sponsorCountries));
    }
    if (badgeData.sponsorValidFrom) {
      formData.append('sponsorValidFrom', badgeData.sponsorValidFrom);
    }
    if (badgeData.sponsorValidUntil) {
      formData.append('sponsorValidUntil', badgeData.sponsorValidUntil);
    }
    if (badgeData.sponsorMetadata) {
      formData.append('sponsorMetadata', JSON.stringify(badgeData.sponsorMetadata));
    }
    
    if (imageFile) {
      formData.append('badgeImage', imageFile);
    }
    if (sponsorLogoFile) {
      formData.append('sponsorLogo', sponsorLogoFile);
    }

    const response = await fetch(
      `${this.API_BASE_URL}/api/badges`,
      {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to create badge" }));
      throw { response: { data: error } };
    }

    const data = await response.json();
    return data.badge;
  }

  async updateBadge(id: string, badgeData: UpdateBadgeDto, imageFile?: File, sponsorLogoFile?: File): Promise<Badge> {
    const formData = new FormData();
    
    if (badgeData.name) formData.append('name', badgeData.name);
    if (badgeData.description) formData.append('description', badgeData.description);
    if (badgeData.category) formData.append('category', badgeData.category);
    if (badgeData.milestoneType) formData.append('milestoneType', badgeData.milestoneType);
    if (badgeData.milestoneThreshold !== undefined) formData.append('milestoneThreshold', badgeData.milestoneThreshold.toString());
    if (badgeData.metricType) formData.append('metricType', badgeData.metricType);
    if (badgeData.rarityScore !== undefined) formData.append('rarityScore', badgeData.rarityScore.toString());
    if (badgeData.iconColor) formData.append('iconColor', badgeData.iconColor);
    if (badgeData.challengeId) formData.append('challengeId', badgeData.challengeId);
    if (badgeData.isActive !== undefined) formData.append('isActive', badgeData.isActive ? 'true' : 'false');
    if (badgeData.isDeleted !== undefined) formData.append('isDeleted', badgeData.isDeleted ? 'true' : 'false');
    
    // Sponsor Badge Fields - Always send to ensure proper updates
    if (badgeData.isSponsorBadge !== undefined) formData.append('isSponsorBadge', badgeData.isSponsorBadge ? 'true' : 'false');
    if (badgeData.sponsorName) formData.append('sponsorName', badgeData.sponsorName);
    if (badgeData.sponsorCountries) formData.append('sponsorCountries', JSON.stringify(badgeData.sponsorCountries));
    if (badgeData.sponsorValidFrom) formData.append('sponsorValidFrom', badgeData.sponsorValidFrom);
    if (badgeData.sponsorValidUntil) formData.append('sponsorValidUntil', badgeData.sponsorValidUntil);
    if (badgeData.sponsorMetadata) formData.append('sponsorMetadata', JSON.stringify(badgeData.sponsorMetadata));
    
    if (imageFile) formData.append('badgeImage', imageFile);
    if (sponsorLogoFile) formData.append('sponsorLogo', sponsorLogoFile);

    const response = await fetch(
      `${this.API_BASE_URL}/api/badges/${id}`,
      {
        method: 'PATCH',
        body: formData,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to update badge" }));
      throw { response: { data: error } };
    }

    const data = await response.json();
    return data.badge;
  }

  async deleteBadge(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiDelete(
      `${this.API_BASE_URL}/api/badges/${id}`,
      "admin"
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to delete badge" }));
      throw { response: { data: error } };
    }

    return response.json();
  }


  async getBadgeStats(): Promise<BadgeStats> {
    const response = await apiGet(
      `${this.API_BASE_URL}/api/badges/stats`,
      "admin"
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to fetch badge stats" }));
      throw { response: { data: error } };
    }

    return response.json();
  }



  async getUserBadges(userId: string): Promise<UserBadge[]> {
    const response = await apiGet(
      `${this.API_BASE_URL}/api/badges/user/${userId}`,
      "admin"
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to fetch user badges" }));
      throw { response: { data: error } };
    }

    const data = await response.json();
    return data.badges || [];
  }

  async getUserBadgeStats(userId: string): Promise<UserBadgeStats> {
    const response = await apiGet(
      `${this.API_BASE_URL}/api/badges/user/${userId}/stats`,
      "admin"
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to fetch user badge stats" }));
      throw { response: { data: error } };
    }

    return response.json();
  }

  async getUserBadgeProgress(userId: string): Promise<BadgeProgress[]> {
    const response = await apiGet(
      `${this.API_BASE_URL}/api/badges/user/${userId}/progress`,
      "admin"
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to fetch badge progress" }));
      throw { response: { data: error } };
    }

    const data = await response.json();
    return data.progress || [];
  }

  async markBadgeAsViewed(userId: string, badgeId: string): Promise<void> {
    const response = await apiPost(
      `${this.API_BASE_URL}/api/badges/user/${userId}/view/${badgeId}`,
      {},
      "admin"
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to mark badge as viewed" }));
      throw { response: { data: error } };
    }
  }

  async awardBadgeToUser(userId: string, badgeId: string, metadata?: any): Promise<UserBadge> {
    const response = await apiPost(
      `${this.API_BASE_URL}/api/badges/award`,
      { userId, badgeId, metadata },
      "admin"
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to award badge" }));
      throw { response: { data: error } };
    }

    const data = await response.json();
    return data.userBadge;
  }

  async checkAndAwardBadges(userId: string, userCountry?: string): Promise<UserBadge[]> {
    const response = await apiPost(
      `${this.API_BASE_URL}/api/badges/check-and-award`,
      { userId, userCountry },
      "admin"
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to check and award badges" }));
      throw { response: { data: error } };
    }

    const data = await response.json();
    return data.newBadges || [];
  }

  async revokeBadge(userId: string, badgeId: string): Promise<{ success: boolean; message: string }> {
    const response = await apiDelete(
      `${this.API_BASE_URL}/api/badges/revoke/${userId}/${badgeId}`,
      "admin"
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to revoke badge" }));
      throw { response: { data: error } };
    }

    return response.json();
  }

  async getBadgeLeaderboard(limit: number = 20): Promise<LeaderboardEntry[]> {
    const response = await apiGet(
      `${this.API_BASE_URL}/api/badges/leaderboard?limit=${limit}`,
      "admin"
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to fetch badge leaderboard" }));
      throw { response: { data: error } };
    }

    const data = await response.json();
    return data.leaderboard || [];
  }
}

export const badgeManagementService = new BadgeManagementService();
