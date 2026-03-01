export interface UserDietaryProfile {
  vegType: string;
  dairyFree: boolean;
  nutFree: boolean;
  glutenFree: boolean;
  hasDiabetes: boolean;
  otherAllergies: string[];
}

export interface UserOnboarding {
  noOfAdults: number;
  noOfChildren: number;
  country?: string;
  stateCode?: string;
  pincode?: string;
}

export interface UserSession {
  id: string;
  device: string | null;
  ipAddress: string | null;
  lastActivity: string;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  country?: string;
  stateCode?: string;
  createdAt: string;
  updatedAt: string;
  dietaryProfile?: UserDietaryProfile;
  onboarding?: UserOnboarding;
  _count?: {
    cookedRecipes: number;
    bookmarkedRecipes: number;
    sessions?: number;
  };
  sessions?: UserSession[];
}

export interface UserStats {
  totalUsers: number;
  totalChefs: number;
  usersWithDietaryProfile: number;
  usersWithOnboarding: number;
  onboardingCompletionRate: string;
  dietaryProfileCompletionRate: string;
}
