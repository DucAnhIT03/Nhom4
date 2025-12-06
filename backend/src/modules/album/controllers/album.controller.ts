import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { AlbumService } from "../services/album.service";
import { CreateAlbumDto } from "../dtos/request/create-album.dto";
import { UpdateAlbumDto } from "../dtos/request/update-album.dto";
import { UpdateAlbumSongsDto } from "../dtos/request/update-album-songs.dto";
import { AlbumResponseDto } from "../dtos/response/album-response.dto";

@ApiTags("Album")
@Controller("albums")
export class AlbumController {
  constructor(private readonly albumService: AlbumService) {}

  @ApiOperation({ summary: "Lấy danh sách tất cả album" })
  @Get()
  findAll(): Promise<AlbumResponseDto[]> {
    return this.albumService.findAll();
  }

  @ApiOperation({ summary: "Lấy danh sách album trending (nổi bật)" })
  @Get("trending")
  findTrending(@Query("limit") limit?: string): Promise<AlbumResponseDto[]> {
    const parsedLimit = limit ? Number(limit) : 10;
    return this.albumService.findTrending(parsedLimit);
  }

  @ApiOperation({ summary: "Lấy chi tiết một album theo ID" })
  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number): Promise<AlbumResponseDto> {
    return this.albumService.findOne(id);
  }

  @ApiOperation({ summary: "Tạo mới một album" })
  @Post()
  create(@Body() dto: CreateAlbumDto): Promise<AlbumResponseDto> {
    return this.albumService.create(dto);
  }

  @ApiOperation({ summary: "Cập nhật thông tin album" })
  @Patch(":id")
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateAlbumDto): Promise<AlbumResponseDto> {
    return this.albumService.update(id, dto);
  }

  @ApiOperation({ summary: "Xóa một album" })
  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number): Promise<void> {
    return this.albumService.remove(id);
  }

  @ApiOperation({ summary: "Lấy danh sách bài hát thuộc một album" })
  @Get(":id/songs")
  getSongs(@Param("id", ParseIntPipe) id: number) {
    return this.albumService.getSongs(id);
  }

  @ApiOperation({ summary: "Thêm bài hát vào album" })
  @Post(":id/songs")
  addSongs(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateAlbumSongsDto) {
    return this.albumService.addSongs(id, dto);
  }

  @ApiOperation({ summary: "Xóa bài hát khỏi album" })
  @Delete(":id/songs")
  removeSongs(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateAlbumSongsDto) {
    return this.albumService.removeSongs(id, dto);
  }
}


