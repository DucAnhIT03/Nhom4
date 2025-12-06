import { IsEmail, IsString, MinLength, IsNotEmpty } from "class-validator";

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  firstName!: string;

  @IsNotEmpty()
  @IsString()
  lastName!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

