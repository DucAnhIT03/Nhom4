import { IsInt } from "class-validator";

export class ToggleWishlistDto {
  @IsInt()
  userId!: number;

  @IsInt()
  songId!: number;
}


