import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SubscriptionPlan } from "../../shared/schemas/subscription-plan.schema";
import { SubscriptionPlanService } from "./services/subscription-plan.service";
import { SubscriptionPlanController } from "./controllers/subscription-plan.controller";

@Module({
  imports: [TypeOrmModule.forFeature([SubscriptionPlan])],
  controllers: [SubscriptionPlanController],
  providers: [SubscriptionPlanService],
  exports: [SubscriptionPlanService],
})
export class SubscriptionPlanModule {}


