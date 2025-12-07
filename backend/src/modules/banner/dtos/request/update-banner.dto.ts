import { IsBoolean, IsInt, IsOptional, IsString, Length, Min } from "class-validator";

export class UpdateBannerDto {
  @IsOptional()
  @IsString()
  @Length(1, 255)
  title?: string;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  imageUrl?: string;

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

