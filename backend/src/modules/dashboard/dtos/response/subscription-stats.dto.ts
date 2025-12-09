import { SubscriptionPlanType, SubscriptionStatus } from "../../../../shared/schemas/subscription.schema";

export class SubscriptionRevenue {
  plan!: SubscriptionPlanType;
  revenue!: number;
  count!: number;
}

export class SubscriptionStatsDto {
  totalSubscriptions!: number;
  subscriptionsByPlan!: Record<SubscriptionPlanType, number>;
  subscriptionsByStatus!: Record<SubscriptionStatus, number>;
  totalRevenue!: number;
  revenueByPlan!: SubscriptionRevenue[];
  subscriptionsByMonth!: Array<{
    month: string;
    subscriptions: number;
    cancellations: number;
    revenue: number;
  }>;
}

