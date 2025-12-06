import { IsInt, IsNotEmpty, IsOptional, IsString, Length } from "class-validator";

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
}


