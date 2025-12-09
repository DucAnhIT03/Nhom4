import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { SongService } from "../services/song.service";
import { CreateSongDto } from "../dtos/request/create-song.dto";
import { UpdateSongDto } from "../dtos/request/update-song.dto";

@ApiTags("Bài hát")
@Controller("songs")
export class SongController {
  constructor(private readonly songService: SongService) {}

  @ApiOperation({ summary: "Lấy danh sách tất cả bài hát" })
  @Get()
  findAll() {
    return this.songService.findAll();
  }

  /**
   * Danh sách các bài hát mới phát hành (mới tạo gần đây nhất).
   * Query:
   * - limit: số bài muốn lấy, mặc định 20
   */
  @ApiOperation({ summary: "Lấy danh sách bài hát mới phát hành" })
  @Get("new-releases")
  getNewReleases(@Query("limit") limit?: string) {
    const parsedLimit = limit ? Number(limit) : undefined;
    return this.songService.getNewReleases(parsedLimit);
  }

  @ApiOperation({ summary: "Lấy chi tiết một bài hát theo ID" })
  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.songService.findOne(id);
  }

  @ApiOperation({ summary: "Tạo mới một bài hát" })
  @Post()
  create(@Body() dto: CreateSongDto) {
    return this.songService.create(dto);
  }

  /**
   * Top track theo tuần (7 ngày gần nhất).
   * Query:
   * - limit: số bài muốn lấy, mặc định 10
   */
  @ApiOperation({ summary: "Lấy top bài hát trong tuần (dựa trên lịch sử nghe)" })
  @Get("top/week")
  getWeeklyTopTracks(@Query("limit") limit?: string) {
    const parsedLimit = limit ? Number(limit) : undefined;
    return this.songService.getWeeklyTopTracks(parsedLimit);
  }

  /**
   * Top track của tất cả thời gian (all time).
   * Query:
   * - limit: số bài muốn lấy, mặc định 50
   */
  @ApiOperation({ summary: "Lấy top bài hát của tất cả thời gian (dựa trên tổng lượt nghe)" })
  @Get("top/all-time")
  getTopTracksOfAllTime(@Query("limit") limit?: string) {
    const parsedLimit = limit ? Number(limit) : undefined;
    return this.songService.getTopTracksOfAllTime(parsedLimit);
  }

  @ApiOperation({ summary: "Lấy danh sách bài hát theo artist ID" })
  @Get("artist/:artistId")
  findByArtistId(@Param("artistId", ParseIntPipe) artistId: number) {
    return this.songService.findByArtistId(artistId);
  }

  @ApiOperation({ summary: "Cập nhật thông tin bài hát" })
  @Patch(":id")
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateSongDto) {
    return this.songService.update(id, dto);
  }

  @ApiOperation({ summary: "Xóa một bài hát" })
  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.songService.remove(id);
  }

  @ApiOperation({ summary: "Tăng lượt nghe của bài hát" })
  @Post(":id/increment-views")
  incrementViews(@Param("id", ParseIntPipe) id: number) {
    return this.songService.incrementViews(id);
  }
}


