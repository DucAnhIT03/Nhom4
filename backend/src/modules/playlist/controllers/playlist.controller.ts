import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PlaylistService } from "../services/playlist.service";
import { CreatePlaylistDto } from "../dtos/request/create-playlist.dto";
import { UpdatePlaylistDto } from "../dtos/request/update-playlist.dto";
import { UpdatePlaylistSongsDto } from "../dtos/request/update-playlist-songs.dto";
import { DownloadSongDto } from "../dtos/request/download-song.dto";

@ApiTags("Playlist")
@Controller("playlists")
export class PlaylistController {
  constructor(private readonly playlistService: PlaylistService) {}

  @ApiOperation({ summary: "Lấy danh sách tất cả playlist" })
  @Get()
  findAll() {
    return this.playlistService.findAll();
  }

  @ApiOperation({ summary: "Lấy chi tiết một playlist theo ID" })
  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.playlistService.findOne(id);
  }

  @ApiOperation({ summary: "Tạo mới một playlist" })
  @Post()
  create(@Body() dto: CreatePlaylistDto) {
    return this.playlistService.create(dto);
  }

  @ApiOperation({ summary: "Cập nhật thông tin playlist" })
  @Patch(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdatePlaylistDto,
  ) {
    return this.playlistService.update(id, dto);
  }

  @ApiOperation({ summary: "Xóa một playlist" })
  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.playlistService.remove(id);
  }

  @ApiOperation({ summary: "Thêm bài hát vào playlist" })
  @Post(":id/songs")
  addSongs(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdatePlaylistSongsDto,
  ) {
    return this.playlistService.addSongs(id, dto);
  }

  @ApiOperation({ summary: "Xóa bài hát khỏi playlist" })
  @Delete(":id/songs")
  removeSongs(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdatePlaylistSongsDto,
  ) {
    return this.playlistService.removeSongs(id, dto);
  }

  @ApiOperation({ summary: "Lấy danh sách bài hát trong playlist" })
  @Get(":id/songs")
  getSongs(@Param("id", ParseIntPipe) id: number) {
    return this.playlistService.getSongs(id);
  }

  @ApiOperation({ summary: "Tải xuống một bài hát từ playlist" })
  @Post(":playlistId/songs/:songId/download")
  downloadSong(
    @Param("playlistId", ParseIntPipe) playlistId: number,
    @Param("songId", ParseIntPipe) songId: number,
    @Body() dto: DownloadSongDto,
  ) {
    return this.playlistService.downloadSongFromPlaylist(playlistId, songId, dto);
  }
}


