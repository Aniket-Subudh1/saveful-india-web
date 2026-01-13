import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/apiClient";

export interface Badge {
  _id: string;
  name: string;
  description: string;
  imageUrl: string;
  category: "MILESTONE" | "CHALLENGE_WINNER" | "SPECIAL";
  milestoneType?: string;
  threshold?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserBadge {
  _id: string;
  userId: string;
  badgeId: string;
  badge: Badge;
  awardedAt: string;
  metadata?: {
    challengeId?: string;
    challengeName?: string;
    rank?: number;
    period?: string;
  };
}

export interface CreateBadgeDto {
  name: string;
  description: string;
  imageUrl: string;
  category: "MILESTONE" | "CHALLENGE_WINNER" | "SPECIAL";
  milestoneType?: string;
  threshold?: number;
}

export interface UpdateBadgeDto {
  name?: string;
  description?: string;
  imageUrl?: string;
  category?: "MILESTONE" | "CHALLENGE_WINNER" | "SPECIAL";
  milestoneType?: string;
  threshold?: number;
  isActive?: boolean;
}

export interface BadgeStats {
  totalBadges: number;
  activeBadges: number;
  milestoneBadges: number;
  challengeBadges: number;
  specialBadges: number;
  totalAwarded: number;
  uniqueRecipients: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  badgeCount: number;
  latestBadge?: {
    name: string;
    awardedAt: string;
  };
}

class BadgeManagementService {
  private readonly API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  // Badge CRUD Operations
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

  async createBadge(badgeData: CreateBadgeDto, imageFile?: File): Promise<Badge> {
    const formData = new FormData();
    formData.append('name', badgeData.name);
    formData.append('description', badgeData.description);
    formData.append('category', badgeData.category);
    
    if (badgeData.milestoneType) {
      formData.append('milestoneType', badgeData.milestoneType);
    }
    if (badgeData.threshold !== undefined) {
      formData.append('milestoneThreshold', badgeData.threshold.toString());
    }
    if (imageFile) {
      formData.append('badgeImage', imageFile);
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

  async updateBadge(id: string, badgeData: UpdateBadgeDto, imageFile?: File): Promise<Badge> {
    const formData = new FormData();
    
    if (badgeData.name) formData.append('name', badgeData.name);
    if (badgeData.description) formData.append('description', badgeData.description);
    if (badgeData.category) formData.append('category', badgeData.category);
    if (badgeData.milestoneType) formData.append('milestoneType', badgeData.milestoneType);
    if (badgeData.threshold !== undefined) formData.append('milestoneThreshold', badgeData.threshold.toString());
    if (badgeData.isActive !== undefined) formData.append('isActive', badgeData.isActive.toString());
    if (imageFile) formData.append('badgeImage', imageFile);

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

  // Badge Stats
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

  // User Badge Operations
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

  // Badge Leaderboard
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
