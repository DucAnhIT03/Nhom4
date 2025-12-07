import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { ArtistMyContentService } from "../services/artist-my-content.service";
import { AuthGuard } from "../../../common/guards/auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";
import { Roles } from "../../../common/decorators/roles.decorator";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { RoleName } from "../../../shared/schemas/role.schema";
import { CreateAlbumDto } from "../../album/dtos/request/create-album.dto";
import { UpdateAlbumDto } from "../../album/dtos/request/update-album.dto";
import { CreateArtistAlbumDto } from "../dtos/request/create-artist-album.dto";
import { UpdateArtistAlbumDto } from "../dtos/request/update-artist-album.dto";
import { CreateSongDto } from "../../song/dtos/request/create-song.dto";
import { UpdateSongDto } from "../../song/dtos/request/update-song.dto";
import { CreateArtistSongDto } from "../dtos/request/create-artist-song.dto";
import { UpdateArtistSongDto } from "../dtos/request/update-artist-song.dto";

@ApiTags("Đăng tải của tôi - Nghệ sĩ")
@Controller("artist/my-content")
@UseGuards(AuthGuard, RolesGuard)
@Roles(RoleName.ARTIST)
@ApiBearerAuth("access-token")
export class ArtistMyContentController {
  constructor(private readonly artistMyContentService: ArtistMyContentService) {}

  @ApiOperation({ summary: "Lấy danh sách album của nghệ sĩ" })
  @Get("albums")
  async getMyAlbums(
    @CurrentUser() user: { id: number; email: string; roles?: RoleName[] } | null,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string,
  ) {
    if (!user) {
      throw new Error("User not authenticated");
    }
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.artistMyContentService.getMyAlbums(user.id, pageNum, limitNum, search);
  }

  @ApiOperation({ summary: "Lấy danh sách tất cả bài hát của nghệ sĩ" })
  @Get("songs")
  async getMySongs(
    @CurrentUser() user: { id: number; email: string; roles?: RoleName[] } | null,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string,
  ) {
    if (!user) {
      throw new Error("User not authenticated");
    }
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.artistMyContentService.getMySongs(user.id, pageNum, limitNum, search);
  }

  @ApiOperation({ summary: "Tạo bài hát mới" })
  @Post("songs")
  async createMySong(
    @CurrentUser() user: { id: number; email: string; roles?: RoleName[] } | null,
    @Body() dto: CreateArtistSongDto,
  ) {
    if (!user) {
      throw new Error("User not authenticated");
    }
    return this.artistMyContentService.createMySong(user.id, dto);
  }

  @ApiOperation({ summary: "Tạo album mới" })
  @Post("albums")
  async createMyAlbum(
    @CurrentUser() user: { id: number; email: string; roles?: RoleName[] } | null,
    @Body() dto: CreateArtistAlbumDto,
  ) {
    if (!user) {
      throw new Error("User not authenticated");
    }
    return this.artistMyContentService.createMyAlbum(user.id, dto);
  }

  @ApiOperation({ summary: "Cập nhật album" })
  @Put("albums/:id")
  async updateMyAlbum(
    @CurrentUser() user: { id: number; email: string; roles?: RoleName[] } | null,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateArtistAlbumDto,
  ) {
    if (!user) {
      throw new Error("User not authenticated");
    }
    return this.artistMyContentService.updateMyAlbum(user.id, id, dto);
  }

  @ApiOperation({ summary: "Xóa album (chỉ khi không có bài hát)" })
  @Delete("albums/:id")
  async deleteMyAlbum(
    @CurrentUser() user: { id: number; email: string; roles?: RoleName[] } | null,
    @Param("id", ParseIntPipe) id: number,
  ) {
    if (!user) {
      throw new Error("User not authenticated");
    }
    return this.artistMyContentService.deleteMyAlbum(user.id, id);
  }

  @ApiOperation({ summary: "Lấy danh sách bài hát trong album" })
  @Get("albums/:albumId/songs")
  async getMyAlbumSongs(
    @CurrentUser() user: { id: number; email: string; roles?: RoleName[] } | null,
    @Param("albumId", ParseIntPipe) albumId: number,
  ) {
    if (!user) {
      throw new Error("User not authenticated");
    }
    return this.artistMyContentService.getMyAlbumSongs(user.id, albumId);
  }

  @ApiOperation({ summary: "Thêm bài hát vào album" })
  @Post("albums/:albumId/songs")
  async addSongToMyAlbum(
    @CurrentUser() user: { id: number; email: string; roles?: RoleName[] } | null,
    @Param("albumId", ParseIntPipe) albumId: number,
    @Body() dto: CreateArtistSongDto,
  ) {
    if (!user) {
      throw new Error("User not authenticated");
    }
    return this.artistMyContentService.addSongToMyAlbum(user.id, albumId, dto);
  }

  @ApiOperation({ summary: "Cập nhật bài hát" })
  @Put("songs/:id")
  async updateMySong(
    @CurrentUser() user: { id: number; email: string; roles?: RoleName[] } | null,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateArtistSongDto,
  ) {
    if (!user) {
      throw new Error("User not authenticated");
    }
    return this.artistMyContentService.updateMySong(user.id, id, dto);
  }

  @ApiOperation({ summary: "Xóa bài hát khỏi album" })
  @Delete("songs/:id")
  async deleteMySong(
    @CurrentUser() user: { id: number; email: string; roles?: RoleName[] } | null,
    @Param("id", ParseIntPipe) id: number,
  ) {
    if (!user) {
      throw new Error("User not authenticated");
    }
    return this.artistMyContentService.deleteMySong(user.id, id);
  }
}


