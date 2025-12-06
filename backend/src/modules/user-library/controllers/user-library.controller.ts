import { Body, Controller, Get, Param, ParseIntPipe, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { UserLibraryService } from "../services/user-library.service";
import { ToggleWishlistDto } from "../dtos/request/toggle-wishlist.dto";
import { AddHistoryDto } from "../dtos/request/add-history.dto";

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
}


