import { IsInt, IsOptional, IsString, Min } from "class-validator";

export class QueryCommentDto {
  @IsInt()
  songId!: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}


