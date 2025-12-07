import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DashboardController } from "./controllers/dashboard.controller";
import { DashboardService } from "./services/dashboard.service";
import { User } from "../../shared/schemas/user.schema";
import { Subscription } from "../../shared/schemas/subscription.schema";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Subscription]),
    AuthModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}


