import { IsInt } from "class-validator";

export class DownloadSongDto {
  @IsInt()
  userId!: number;
}


