import { IsEmail, IsString, IsOptional, IsEnum } from "class-validator";
import { UserStatus } from "../../../../shared/schemas/user.schema";

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  profileImage?: string;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}

