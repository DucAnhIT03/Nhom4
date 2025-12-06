import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Length } from "class-validator";

export class CreatePlaylistDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name!: string;

  @IsInt()
  userId!: number;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}


