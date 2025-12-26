export interface UserDietaryProfile {
  vegType: string;
  dairyFree: boolean;
  nutFree: boolean;
  glutenFree: boolean;
  hasDiabetes: boolean;
  otherAllergies: string[];
  updatedAt: string;
}

export interface UserOnboarding {
  postcode: string;
  suburb: string;
  noOfAdults: number;
  noOfChildren: number;
  tastePreference: string[];
  trackSurveyDay: string | null;
  updatedAt: string;
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
  phoneNumber?: string;
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
