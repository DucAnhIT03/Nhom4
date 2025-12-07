import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../../../common/guards/auth.guard";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { CommentService } from "../services/comment.service";
import { CreateCommentDto } from "../dtos/request/create-comment.dto";
import { UpdateCommentDto } from "../dtos/request/update-comment.dto";
import { QueryCommentDto } from "../dtos/request/query-comment.dto";

@ApiTags("Bình luận")
@Controller("comments")
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @ApiOperation({ summary: "Lấy danh sách bình luận của một bài hát" })
  @Get()
  findBySong(@Query() query: QueryCommentDto) {
    return this.commentService.findBySong(query);
  }

  @ApiOperation({ summary: "Lấy chi tiết một bình luận" })
  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.commentService.findOne(id);
  }

  @ApiOperation({ summary: "Tạo mới bình luận" })
  @Post()
  create(@Body() dto: CreateCommentDto) {
    return this.commentService.create(dto);
  }

  @ApiOperation({ summary: "Cập nhật nội dung bình luận" })
  @Patch(":id")
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateCommentDto) {
    return this.commentService.update(id, dto);
  }

  @ApiOperation({ summary: "Xóa bình luận" })
  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.commentService.remove(id);
  }

  @ApiOperation({ summary: "Lấy comments của bài hát do nghệ sĩ sở hữu" })
  @Get("artist/:artistId")
  @UseGuards(AuthGuard)
  findByArtistSongs(
    @Param("artistId", ParseIntPipe) artistId: number,
    @Query("sortBy") sortBy?: "time" | "likes",
  ) {
    return this.commentService.findByArtistSongs(artistId, sortBy || "time");
  }

  @ApiOperation({ summary: "Xóa bình luận (chỉ nghệ sĩ sở hữu bài hát)" })
  @Delete("artist/:id")
  @UseGuards(AuthGuard)
  removeByArtist(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.commentService.removeByArtist(id, user.id);
  }
}


