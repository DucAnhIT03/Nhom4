import { IsEnum, IsInt, IsOptional, IsDateString } from "class-validator";
import { SubscriptionPlanType, SubscriptionStatus } from "../../../../shared/schemas/subscription.schema";

export class CreateSubscriptionDto {
  @IsInt()
  userId!: number;

  @IsEnum(SubscriptionPlanType)
  plan!: SubscriptionPlanType;

  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsEnum(SubscriptionStatus)
  status!: SubscriptionStatus;
}


