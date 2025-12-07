import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Length, Min } from "class-validator";

export class CreateBannerDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  imageUrl!: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsInt()
  songId?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

