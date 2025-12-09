import { IsInt } from "class-validator";

export class AddDownloadDto {
  @IsInt()
  userId!: number;

  @IsInt()
  songId!: number;
}

