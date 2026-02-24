import { authService } from "./authService";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  country?: string;
  stateCode?: string;
  createdAt: string;
  updatedAt: string;
  dietaryProfile?: {
    vegType?: string;
    dairyFree?: boolean;
    nutFree?: boolean;
    glutenFree?: boolean;
    hasDiabetes?: boolean;
    otherAllergies?: string[];
  } | null;
  onboarding?: {
    noOfAdults?: number;
    noOfChildren?: number;
    country?: string;
    stateCode?: string;
    pincode?: string | null;
  } | null;
}

export interface AdminUsersResponse {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  users: AdminUser[];
}

export enum StorageLocation {
  FRIDGE = "fridge",
  FREEZER = "freezer",
  PANTRY = "pantry",
  OTHER = "other",
}

export enum FreshnessStatus {
  FRESH = "fresh",
  EXPIRING_SOON = "expiring_soon",
  EXPIRED = "expired",
}

export enum WasteType {
  WET = "wet_waste",
  DRY = "dry_waste",
  HAZARDOUS = "hazardous",
}

export enum DiscardReason {
  EXPIRED = "expired",
  SPOILED = "spoiled",
  LEFTOVER = "leftover",
  UNUSED = "unused",
  COOKED = "cooked",
}

export enum InventoryItemSource {
  MANUAL = "manual",
  VOICE = "voice",
  SHOPPING_LIST = "shopping_list",
  RECIPE = "recipe",
}


export interface InventoryItem {
  _id: string;
  userId: string;
  ingredientId?: string;
  name: string;
  quantity: number;
  unit: string;
  storageLocation: StorageLocation;
  freshnessStatus: FreshnessStatus;
  expiresAt?: string;
  addedAt: string;
  source: InventoryItemSource;
  isDiscarded: boolean;
  wasteType?: WasteType;
  discardReason?: DiscardReason;
  discardNotes?: string;
  discardedAt?: string;
  discardedQuantity?: number;
  countries?: string[];
  heroImageUrl?: string;
  categoryId?: string;
  isStaple?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryGroupedResponse {
  summary: {
    total: number;
    expiringSoon: number;
    expired: number;
    fresh: number;
  };
  groups: {
    location: StorageLocation;
    items: InventoryItem[];
    count: number;
  }[];
}

export interface WasteAnalytics {
  totalDiscarded: number;
  byWasteType: { type: WasteType; count: number; percentage: number }[];
  byReason: { reason: DiscardReason; count: number; percentage: number }[];
  topWastedItems: { name: string; count: number }[];
  monthlyTrend: { month: string; count: number }[];
}

export interface MealSuggestion {
  recipe: {
    _id: string;
    title: string;
    heroImageUrl?: string;
    cookTime?: number;
    portions?: number;
  };
  matchPercentage: number;
  matchedIngredients: string[];
  missingIngredients: string[];
  expiringIngredientsUsed: string[];
  aiReason?: string;
}

export interface GetInventoryQuery {
  storageLocation?: StorageLocation;
  freshnessStatus?: FreshnessStatus;
  search?: string;
  expiringWithinDays?: number;
}

class InventoryManagementService {
  private readonly baseURL = process.env.NEXT_PUBLIC_API_URL;

  private getAuthHeaders(): Record<string, string> {
    const token = authService.getStoredToken("admin");
    if (!token) throw new Error("No authentication token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }

  async getInventoryByUser(
    userId: string,
    query?: GetInventoryQuery
  ): Promise<InventoryItem[]> {
    const params = new URLSearchParams();
    if (query?.storageLocation) params.set("storageLocation", query.storageLocation);
    if (query?.freshnessStatus) params.set("freshnessStatus", query.freshnessStatus);
    if (query?.search) params.set("search", query.search);
    if (query?.expiringWithinDays) params.set("expiringWithinDays", String(query.expiringWithinDays));

    const qs = params.toString();
    const response = await fetch(
      `${this.baseURL}/api/inventory/admin/user/${userId}${qs ? `?${qs}` : ""}`,
      { headers: this.getAuthHeaders(), cache: "no-store" }
    );

    if (!response.ok) throw new Error("Failed to fetch user inventory");
    return response.json();
  }

  async getInventoryGroupedByUser(
    userId: string
  ): Promise<InventoryGroupedResponse> {
    const response = await fetch(
      `${this.baseURL}/api/inventory/admin/user/${userId}/grouped`,
      { headers: this.getAuthHeaders(), cache: "no-store" }
    );

    if (!response.ok) throw new Error("Failed to fetch grouped inventory");
    return response.json();
  }

  async getExpiringItemsByUser(
    userId: string,
    days = 3
  ): Promise<InventoryItem[]> {
    const response = await fetch(
      `${this.baseURL}/api/inventory/admin/user/${userId}/expiring?days=${days}`,
      { headers: this.getAuthHeaders(), cache: "no-store" }
    );

    if (!response.ok) throw new Error("Failed to fetch expiring items");
    return response.json();
  }

  async getWasteAnalyticsByUser(userId: string): Promise<WasteAnalytics> {
    const response = await fetch(
      `${this.baseURL}/api/inventory/admin/user/${userId}/analytics`,
      { headers: this.getAuthHeaders(), cache: "no-store" }
    );

    if (!response.ok) throw new Error("Failed to fetch waste analytics");
    return response.json();
  }

  async getGlobalWasteAnalytics(): Promise<WasteAnalytics> {
    const response = await fetch(
      `${this.baseURL}/api/inventory/admin/analytics`,
      { headers: this.getAuthHeaders(), cache: "no-store" }
    );

    if (!response.ok) throw new Error("Failed to fetch global analytics");
    return response.json();
  }

  async getGlobalExpiringItems(days = 3): Promise<{
    total: number;
    users: { userId: string; email: string; expiringCount: number }[];
  }> {
    const response = await fetch(
      `${this.baseURL}/api/inventory/admin/expiring?days=${days}`,
      { headers: this.getAuthHeaders(), cache: "no-store" }
    );

    if (!response.ok) throw new Error("Failed to fetch global expiring items");
    return response.json();
  }

  async getInventoryOverview(): Promise<{
    totalUsers: number;
    totalItems: number;
    totalDiscarded: number;
    avgItemsPerUser: number;
    topWastedIngredients: { name: string; count: number }[];
    wasteByType: { type: WasteType; count: number }[];
  }> {
    const response = await fetch(
      `${this.baseURL}/api/inventory/admin/overview`,
      { headers: this.getAuthHeaders(), cache: "no-store" }
    );

    if (!response.ok) throw new Error("Failed to fetch inventory overview");
    return response.json();
  }

  async deleteInventoryItem(itemId: string): Promise<void> {
    const response = await fetch(
      `${this.baseURL}/api/inventory/admin/${itemId}`,
      {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) throw new Error("Failed to delete inventory item");
  }

  async searchAdminUsers(params: {
    name?: string;
    country?: string;
    page?: number;
    limit?: number;
  }): Promise<AdminUsersResponse> {
    const qs = new URLSearchParams();
    if (params.name) qs.set("name", params.name);
    if (params.country) qs.set("country", params.country);
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));

    const response = await fetch(
      `${this.baseURL}/api/admin/users${qs.toString() ? `?${qs.toString()}` : ""}`,
      { headers: this.getAuthHeaders(), cache: "no-store" }
    );
    if (!response.ok) throw new Error("Failed to search users");
    return response.json();
  }
}

export const inventoryManagementService = new InventoryManagementService();
