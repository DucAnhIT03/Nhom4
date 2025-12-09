import { UserStatus } from "../../../../shared/schemas/user.schema";
import { SubscriptionPlanType } from "../../../../shared/schemas/subscription.schema";

export class UserStatsDto {
  totalUsers!: number;
  usersByStatus!: Record<UserStatus, number>;
  usersByPlan!: Record<SubscriptionPlanType, number>;
  activeUsers!: number;
  blockedUsers!: number;
  verifyUsers!: number;
  freeUsers!: number;
  premiumUsers!: number;
  artistUsers!: number;
}

