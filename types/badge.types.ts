export enum BadgeCategory {
  ONBOARDING = 'ONBOARDING',
  USAGE = 'USAGE',
  COOKING = 'COOKING',
  MONEY_SAVED = 'MONEY_SAVED',
  FOOD_SAVED = 'FOOD_SAVED',
  PLANNING = 'PLANNING',
  BONUS = 'BONUS',
  SPONSOR = 'SPONSOR',
  CHALLENGE_WINNER = 'CHALLENGE_WINNER',
  SPECIAL = 'SPECIAL',
}

export enum MilestoneType {
  FIRST_RECIPE_COOKED = 'FIRST_RECIPE_COOKED', 
  
  TOTAL_APP_SESSIONS_3 = 'TOTAL_APP_SESSIONS_3', 
  TOTAL_APP_SESSIONS_7 = 'TOTAL_APP_SESSIONS_7', 
  TOTAL_APP_SESSIONS_20 = 'TOTAL_APP_SESSIONS_20',
  TOTAL_APP_SESSIONS_50 = 'TOTAL_APP_SESSIONS_50', 
  
  RECIPES_COOKED_5 = 'RECIPES_COOKED_5',
  RECIPES_COOKED_10 = 'RECIPES_COOKED_10',
  RECIPES_COOKED_25 = 'RECIPES_COOKED_25',
  RECIPES_COOKED_50 = 'RECIPES_COOKED_50',
  
  MONEY_SAVED_25 = 'MONEY_SAVED_25', 
  MONEY_SAVED_50 = 'MONEY_SAVED_50',
  MONEY_SAVED_100 = 'MONEY_SAVED_100', 
  MONEY_SAVED_250 = 'MONEY_SAVED_250',
  MONEY_SAVED_500 = 'MONEY_SAVED_500',
  
  FIRST_FOOD_SAVED = 'FIRST_FOOD_SAVED', 
  FOOD_SAVED_5KG = 'FOOD_SAVED_5KG', 
  FOOD_SAVED_10KG = 'FOOD_SAVED_10KG', 
  FOOD_SAVED_15KG = 'FOOD_SAVED_15KG',
  FOOD_SAVED_20KG = 'FOOD_SAVED_20KG',
  
  SHOPPING_LIST_1 = 'SHOPPING_LIST_1', 
  SHOPPING_LIST_5 = 'SHOPPING_LIST_5', 
  SHOPPING_LIST_10 = 'SHOPPING_LIST_10',
  SHOPPING_LIST_25 = 'SHOPPING_LIST_25', 
  
  WEEKDAY_MEALS_5 = 'WEEKDAY_MEALS_5',
  
  COOKING_STREAK = 'COOKING_STREAK',
  CHALLENGE_PARTICIPATION = 'CHALLENGE_PARTICIPATION',
}

export enum MetricType {
  RECIPES_COOKED = 'RECIPES_COOKED',
  APP_SESSIONS = 'APP_SESSIONS',
  MONEY_SAVED_CUMULATIVE = 'MONEY_SAVED_CUMULATIVE',
  FOOD_WEIGHT_SAVED = 'FOOD_WEIGHT_SAVED', // in kg
  SHOPPING_LISTS_CREATED = 'SHOPPING_LISTS_CREATED',
  WEEKDAY_MEALS_COOKED = 'WEEKDAY_MEALS_COOKED',
  FIRST_EVENT = 'FIRST_EVENT',
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
  rarityScore: number; 
  iconColor?: string;
  isActive: boolean;
  isDeleted: boolean;
  challengeId?: string; 
  
  isSponsorBadge: boolean;
  sponsorName?: string; 
  sponsorLogoUrl?: string;
  sponsorCountries?: string[];
  sponsorValidFrom?: Date | string;
  sponsorValidUntil?: Date | string;
  sponsorMetadata?: {
    campaignId?: string;
    redemptionCode?: string;
    sponsorLink?: string;
    termsAndConditions?: string;
  };
  
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface UserBadge {
  _id: string;
  userId: string;
  badgeId: string;
  badge?: Badge; 
  earnedAt: Date | string;
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
    awardedAt: Date | string;
  };
}

export const BADGE_CATEGORY_LABELS: Record<BadgeCategory, string> = {
  [BadgeCategory.ONBOARDING]: 'Onboarding',
  [BadgeCategory.USAGE]: 'Usage',
  [BadgeCategory.COOKING]: 'Cooking',
  [BadgeCategory.MONEY_SAVED]: 'Money Saved',
  [BadgeCategory.FOOD_SAVED]: 'Food Saved',
  [BadgeCategory.PLANNING]: 'Planning',
  [BadgeCategory.BONUS]: 'Bonus',
  [BadgeCategory.SPONSOR]: 'Sponsor',
  [BadgeCategory.CHALLENGE_WINNER]: 'Challenge Winner',
  [BadgeCategory.SPECIAL]: 'Special',
};

export const BADGE_CATEGORY_COLORS: Record<BadgeCategory, string> = {
  [BadgeCategory.ONBOARDING]: '#4CAF50',
  [BadgeCategory.USAGE]: '#2196F3',
  [BadgeCategory.COOKING]: '#FF9800',
  [BadgeCategory.MONEY_SAVED]: '#4CAF50',
  [BadgeCategory.FOOD_SAVED]: '#8BC34A',
  [BadgeCategory.PLANNING]: '#9C27B0',
  [BadgeCategory.BONUS]: '#FF5722',
  [BadgeCategory.SPONSOR]: '#E91E63',
  [BadgeCategory.CHALLENGE_WINNER]: '#FFC107',
  [BadgeCategory.SPECIAL]: '#00BCD4',
};
