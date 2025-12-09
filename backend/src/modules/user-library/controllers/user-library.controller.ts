import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { UserLibraryService } from "../services/user-library.service";
import { ToggleWishlistDto } from "../dtos/request/toggle-wishlist.dto";
import { AddHistoryDto } from "../dtos/request/add-history.dto";
import { AddDownloadDto } from "../dtos/request/add-download.dto";
import { RemoveDownloadDto } from "../dtos/request/remove-download.dto";

@ApiTags("Thư viện người dùng")
@Controller("library")
export class UserLibraryController {
  constructor(private readonly userLibraryService: UserLibraryService) {}

  @ApiOperation({ summary: "Thêm / bỏ bài hát khỏi danh sách yêu thích (wishlist)" })
  @Post("wishlist/toggle")
  toggleWishlist(@Body() dto: ToggleWishlistDto) {
    return this.userLibraryService.toggleWishlist(dto);
  }

  @ApiOperation({ summary: "Lấy danh sách bài hát yêu thích của user" })
  @Get("wishlist/:userId")
  getWishlist(@Param("userId", ParseIntPipe) userId: number) {
    return this.userLibraryService.getWishlist(userId);
  }

  @ApiOperation({ summary: "Thêm lịch sử nghe bài hát cho user" })
  @Post("history")
  addHistory(@Body() dto: AddHistoryDto) {
    return this.userLibraryService.addHistory(dto);
  }

  @ApiOperation({ summary: "Lấy lịch sử nghe bài hát của user" })
  @Get("history/:userId")
  getHistory(@Param("userId", ParseIntPipe) userId: number) {
    return this.userLibraryService.getHistory(userId);
  }

  @ApiOperation({ summary: "Lấy danh sách bài hát nghe nhiều nhất của user (playlist)" })
  @Get("most-played/:userId")
  getMostPlayedSongs(
    @Param("userId", ParseIntPipe) userId: number,
  ) {
    return this.userLibraryService.getMostPlayedSongs(userId);
  }

  @ApiOperation({ summary: "Lấy danh sách bài hát phổ biến của các thể loại mà user hay nghe" })
  @Get("favorite-genres-popular/:userId")
  getUserFavoriteGenresPopularSongs(
    @Param("userId", ParseIntPipe) userId: number,
  ) {
    return this.userLibraryService.getUserFavoriteGenresPopularSongs(userId);
  }

  @ApiOperation({ summary: "Thêm bài hát vào danh sách tải xuống của user" })
  @Post("downloads")
  addDownload(@Body() dto: AddDownloadDto) {
    return this.userLibraryService.addDownload(dto);
  }

  @ApiOperation({ summary: "Xóa bài hát khỏi danh sách tải xuống của user" })
  @Delete("downloads")
  removeDownload(@Body() dto: RemoveDownloadDto) {
    return this.userLibraryService.removeDownload(dto);
  }

  @ApiOperation({ summary: "Lấy danh sách bài hát đã tải xuống của user" })
  @Get("downloads/:userId")
  getDownloads(@Param("userId", ParseIntPipe) userId: number) {
    return this.userLibraryService.getDownloads(userId);
  }
}


