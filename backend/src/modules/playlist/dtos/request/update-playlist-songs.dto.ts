import { IsArray, IsInt, ArrayNotEmpty } from "class-validator";

export class UpdatePlaylistSongsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  songIds!: number[];
}


