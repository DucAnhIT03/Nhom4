import { IsNotEmpty, IsString, Length } from "class-validator";

export class CreateGenreDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  genreName!: string;
}


