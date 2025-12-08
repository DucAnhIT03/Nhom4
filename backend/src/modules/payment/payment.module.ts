import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Payment } from "../../shared/schemas/payment.schema";
import { Subscription } from "../../shared/schemas/subscription.schema";
import { SubscriptionPlan } from "../../shared/schemas/subscription-plan.schema";
import { PaymentService } from "./services/payment.service";
import { MomoService } from "./services/momo.service";
import { PaymentController } from "./controllers/payment.controller";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Subscription, SubscriptionPlan]), AuthModule],
  controllers: [PaymentController],
  providers: [PaymentService, MomoService],
  exports: [PaymentService, MomoService],
})
export class PaymentModule {}


