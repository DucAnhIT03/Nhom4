import { ArrayNotEmpty, IsArray, IsInt } from "class-validator";

export class UpdateSongGenresDto {
  @IsInt()
  songId!: number;

  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  genreIds!: number[];
}


