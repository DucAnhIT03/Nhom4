import { IsDateString, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Length, ValidateIf } from "class-validator";
import { AlbumType } from "../../../../shared/schemas/album.schema";

export class CreateAlbumDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  title!: string;

  @IsOptional()
  @IsDateString()
  releaseDate?: string;

  @ValidateIf((o) => !o.genreId)
  @IsInt()
  artistId?: number;

  @ValidateIf((o) => !o.artistId)
  @IsInt()
  genreId?: number;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  coverImage?: string;

  @IsEnum(AlbumType)
  type!: AlbumType;
}


