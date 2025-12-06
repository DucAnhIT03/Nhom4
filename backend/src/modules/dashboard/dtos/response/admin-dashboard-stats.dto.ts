import { UserStatus } from "../../../../shared/schemas/user.schema";
import {
  SubscriptionPlanType,
  SubscriptionStatus,
} from "../../../../shared/schemas/subscription.schema";

export type CountByKey<K extends string> = Record<K, number>;

export class AdminDashboardStatsDto {
  totalUsers!: number;
  usersByStatus!: CountByKey<UserStatus>;

  totalSubscriptions!: number;
  subscriptionsByPlan!: CountByKey<SubscriptionPlanType>;
  subscriptionsByStatus!: CountByKey<SubscriptionStatus>;
}


