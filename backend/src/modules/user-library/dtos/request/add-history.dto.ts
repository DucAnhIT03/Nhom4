import { IsInt } from "class-validator";

export class AddHistoryDto {
  @IsInt()
  userId!: number;

  @IsInt()
  songId!: number;
}


