import { ArrayNotEmpty, IsArray, IsInt } from "class-validator";

export class UpdateAlbumSongsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  songIds!: number[];
}


