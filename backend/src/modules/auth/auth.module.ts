import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { AuthGuard } from "../../common/guards/auth.guard";
import { MailModule } from "../mail/mail.module";
import { User } from "../../shared/schemas/user.schema";
import { Role } from "../../shared/schemas/role.schema";
import { UserRole } from "../../shared/schemas/user-role.schema";
import { Otp } from "../../shared/schemas/otp.schema";

@Module({
  imports: [
    MailModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? "change-me",
      signOptions: { expiresIn: "1h" },
    }),
    TypeOrmModule.forFeature([User, Role, UserRole, Otp]),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard],
  exports: [AuthService, AuthGuard, JwtModule],
})
export class AuthModule {}


