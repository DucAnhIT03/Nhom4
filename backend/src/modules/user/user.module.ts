import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserController } from "./controllers/user.controller";
import { UserService } from "./user.service";
import { User } from "../../shared/schemas/user.schema";
import { Role } from "../../shared/schemas/role.schema";
import { UserRole } from "../../shared/schemas/user-role.schema";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, UserRole]),
    forwardRef(() => AuthModule),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}

