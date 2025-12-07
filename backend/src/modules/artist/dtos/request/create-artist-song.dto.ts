import { IsInt, IsNotEmpty, IsOptional, IsString, Length } from "class-validator";

export class CreateArtistSongDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  title!: string;

  @IsOptional()
  @IsString()
  duration?: string;

  @IsOptional()
  @IsInt()
  albumId?: number;

  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  fileUrl!: string;

  @IsOptional()
  @IsInt()
  genreId?: number;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  coverImage?: string;
}

