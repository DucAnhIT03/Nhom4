import { IsInt } from "class-validator";

export class RemoveDownloadDto {
  @IsInt()
  userId!: number;

  @IsInt()
  songId!: number;
}

