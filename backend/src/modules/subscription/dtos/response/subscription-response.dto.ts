import { SubscriptionPlanType, SubscriptionStatus } from "../../../../shared/schemas/subscription.schema";

export class SubscriptionResponseDto {
  id!: number;
  userId!: number;
  plan!: SubscriptionPlanType;
  startTime?: Date;
  endTime?: Date;
  status!: SubscriptionStatus;
  createdAt!: Date;
  updatedAt!: Date;
}


