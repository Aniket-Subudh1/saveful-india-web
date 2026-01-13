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
