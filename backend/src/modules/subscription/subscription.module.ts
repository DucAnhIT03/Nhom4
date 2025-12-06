import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Subscription } from "../../shared/schemas/subscription.schema";
import { SubscriptionService } from "./services/subscription.service";
import { SubscriptionController } from "./controllers/subscription.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Subscription])],
  controllers: [SubscriptionController],
  providers: [SubscriptionService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}


