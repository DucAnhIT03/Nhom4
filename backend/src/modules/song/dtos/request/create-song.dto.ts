import { IsInt, IsNotEmpty, IsOptional, IsString, Length, IsEnum } from "class-validator";

export class CreateSongDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  title!: string;

  @IsOptional()
  @IsString()
  duration?: string;

  @IsInt()
  artistId!: number;

  @IsOptional()
  @IsInt()
  albumId?: number;

  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  fileUrl!: string; // Bắt buộc vì phải upload file

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  lyrics?: string;

  @IsOptional()
  @IsEnum(["FREE", "PREMIUM"])
  type?: "FREE" | "PREMIUM";
}


