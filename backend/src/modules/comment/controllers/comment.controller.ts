import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
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
}


