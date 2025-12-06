import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { GenreService } from "../services/genre.service";
import { CreateGenreDto } from "../dtos/request/create-genre.dto";
import { UpdateGenreDto } from "../dtos/request/update-genre.dto";
import { UpdateSongGenresDto } from "../dtos/request/update-song-genres.dto";

@ApiTags("Thể loại")
@Controller("genres")
export class GenreController {
  constructor(private readonly genreService: GenreService) {}

  @ApiOperation({ summary: "Lấy danh sách tất cả thể loại" })
  @Get()
  findAll() {
    return this.genreService.findAll();
  }

  @ApiOperation({ summary: "Lấy chi tiết một thể loại" })
  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.genreService.findOne(id);
  }

  @ApiOperation({ summary: "Tạo mới một thể loại" })
  @Post()
  create(@Body() dto: CreateGenreDto) {
    return this.genreService.create(dto);
  }

  /**
   * Danh sách Top Genres.
   * Dựa trên số lượng bài hát thuộc mỗi thể loại.
   * Query:
   * - limit: số genre muốn lấy, mặc định 10
   */
  @ApiOperation({ summary: "Lấy danh sách thể loại phổ biến (Top Genres)" })
  @Get("top")
  getTopGenres(@Query("limit") limit?: string) {
    const parsedLimit = limit ? Number(limit) : undefined;
    return this.genreService.getTopGenres(parsedLimit);
  }

  @ApiOperation({ summary: "Cập nhật thông tin thể loại" })
  @Patch(":id")
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateGenreDto) {
    return this.genreService.update(id, dto);
  }

  @ApiOperation({ summary: "Xóa một thể loại" })
  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.genreService.remove(id);
  }

  @ApiOperation({ summary: "Lấy danh sách thể loại của một bài hát" })
  @Get("song/:songId")
  getGenresOfSong(@Param("songId", ParseIntPipe) songId: number) {
    return this.genreService.getGenresOfSong(songId);
  }

  @ApiOperation({ summary: "Cập nhật danh sách thể loại cho một bài hát" })
  @Post("song")
  updateSongGenres(@Body() dto: UpdateSongGenresDto) {
    return this.genreService.updateSongGenres(dto);
  }
}


