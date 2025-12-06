import { IsInt, IsNotEmpty, IsOptional, IsString, Length } from "class-validator";

export class CreateCommentDto {
  @IsInt()
  userId!: number;

  @IsInt()
  songId!: number;

  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  content!: string;

  @IsOptional()
  @IsInt()
  parentId?: number;
}


