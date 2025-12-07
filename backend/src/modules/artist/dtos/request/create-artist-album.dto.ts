import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, Length } from "class-validator";
import { AlbumType } from "../../../../shared/schemas/album.schema";

export class CreateArtistAlbumDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  title!: string;

  @IsOptional()
  @IsDateString()
  releaseDate?: string;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  coverImage?: string;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  backgroundMusic?: string;

  @IsEnum(AlbumType)
  type!: AlbumType;
}

