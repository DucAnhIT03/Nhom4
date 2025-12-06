import { IsDateString, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Length } from "class-validator";
import { AlbumType } from "../../../../shared/schemas/album.schema";

export class CreateAlbumDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  title!: string;

  @IsOptional()
  @IsDateString()
  releaseDate?: string;

  @IsInt()
  artistId!: number;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  coverImage?: string;

  @IsEnum(AlbumType)
  type!: AlbumType;
}


