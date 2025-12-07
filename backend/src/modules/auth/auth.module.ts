import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { UserRoleService } from "./services/user-role.service";
import { AuthGuard } from "../../common/guards/auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { MailModule } from "../mail/mail.module";
import { User } from "../../shared/schemas/user.schema";
import { Role } from "../../shared/schemas/role.schema";
import { UserRole } from "../../shared/schemas/user-role.schema";
import { Otp } from "../../shared/schemas/otp.schema";
import { Artist } from "../../shared/schemas/artist.schema";

@Module({
  imports: [
    MailModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? "change-me",
      signOptions: { expiresIn: "1h" },
    }),
    TypeOrmModule.forFeature([User, Role, UserRole, Otp, Artist]),
  ],
  controllers: [AuthController],
  providers: [AuthService, UserRoleService, AuthGuard, RolesGuard],
  exports: [AuthService, UserRoleService, AuthGuard, RolesGuard, JwtModule],
})
export class AuthModule {}


