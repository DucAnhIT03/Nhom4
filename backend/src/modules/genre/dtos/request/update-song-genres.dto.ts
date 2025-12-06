import { IsArray, IsInt } from "class-validator";

export class UpdateSongGenresDto {
  @IsInt()
  songId!: number;

  @IsArray()
  @IsInt({ each: true })
  genreIds!: number[]; // Cho phép mảng rỗng để xóa tất cả thể loại
}


