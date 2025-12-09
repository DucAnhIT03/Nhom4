import { Controller, Get, Query, UseGuards, ParseIntPipe } from "@nestjs/common";
import { ApiOperation, ApiTags, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { DashboardService } from "../services/dashboard.service";
import { AdminDashboardStatsDto } from "../dtos/response/admin-dashboard-stats.dto";
import { UserStatsDto } from "../dtos/response/user-stats.dto";
import { SongStatsDto } from "../dtos/response/song-stats.dto";
import { AlbumStatsDto } from "../dtos/response/album-stats.dto";
import { ArtistStatsDto } from "../dtos/response/artist-stats.dto";
import { CommentStatsDto } from "../dtos/response/comment-stats.dto";
import { SubscriptionStatsDto } from "../dtos/response/subscription-stats.dto";
import { GenreStatsDto } from "../dtos/response/genre-stats.dto";
import { AuthGuard } from "../../../common/guards/auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";
import { Roles } from "../../../common/decorators/roles.decorator";
import { RoleName } from "../../../shared/schemas/role.schema";

class DashboardFilterQuery {
  from?: string;
  to?: string;
  limit?: string;
}

@ApiTags("Dashboard quản trị")
@Controller("dashboard")
@UseGuards(AuthGuard, RolesGuard)
@Roles(RoleName.ADMIN)
@ApiBearerAuth("access-token")
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get("admin/overview")
  @ApiOperation({
    summary:
      "Thống kê tổng quan cho dashboard admin (số lượng người dùng, subscription theo trạng thái và gói).",
  })
  async getAdminOverview(
    @Query() query: DashboardFilterQuery,
  ): Promise<AdminDashboardStatsDto> {
    const from = query.from ? new Date(query.from) : undefined;
    const to = query.to ? new Date(query.to) : undefined;

    return this.dashboardService.getAdminOverview({ from, to });
  }

  @Get("users/stats")
  @ApiOperation({
    summary: "Thống kê người dùng theo trạng thái và loại tài khoản.",
  })
  @ApiQuery({ name: "from", required: false, type: String })
  @ApiQuery({ name: "to", required: false, type: String })
  async getUserStats(
    @Query() query: DashboardFilterQuery,
  ): Promise<UserStatsDto> {
    const from = query.from ? new Date(query.from) : undefined;
    const to = query.to ? new Date(query.to) : undefined;

    return this.dashboardService.getUserStats({ from, to });
  }

  @Get("songs/stats")
  @ApiOperation({
    summary: "Thống kê bài hát: tổng số, lượt nghe, top bài hát yêu thích.",
  })
  @ApiQuery({ name: "from", required: false, type: String })
  @ApiQuery({ name: "to", required: false, type: String })
  @ApiQuery({ name: "limit", required: false, type: Number })
  async getSongStats(
    @Query() query: DashboardFilterQuery,
  ): Promise<SongStatsDto> {
    const from = query.from ? new Date(query.from) : undefined;
    const to = query.to ? new Date(query.to) : undefined;
    const limit = query.limit ? parseInt(query.limit, 10) : 10;

    return this.dashboardService.getSongStats({ from, to }, limit);
  }

  @Get("albums/stats")
  @ApiOperation({
    summary: "Thống kê album: tổng số, album phổ biến, theo nghệ sĩ.",
  })
  @ApiQuery({ name: "from", required: false, type: String })
  @ApiQuery({ name: "to", required: false, type: String })
  @ApiQuery({ name: "limit", required: false, type: Number })
  async getAlbumStats(
    @Query() query: DashboardFilterQuery,
  ): Promise<AlbumStatsDto> {
    const from = query.from ? new Date(query.from) : undefined;
    const to = query.to ? new Date(query.to) : undefined;
    const limit = query.limit ? parseInt(query.limit, 10) : 10;

    return this.dashboardService.getAlbumStats({ from, to }, limit);
  }

  @Get("artists/stats")
  @ApiOperation({
    summary: "Thống kê nghệ sĩ: tổng số, top nghệ sĩ theo album/song/views.",
  })
  @ApiQuery({ name: "from", required: false, type: String })
  @ApiQuery({ name: "to", required: false, type: String })
  @ApiQuery({ name: "limit", required: false, type: Number })
  async getArtistStats(
    @Query() query: DashboardFilterQuery,
  ): Promise<ArtistStatsDto> {
    const from = query.from ? new Date(query.from) : undefined;
    const to = query.to ? new Date(query.to) : undefined;
    const limit = query.limit ? parseInt(query.limit, 10) : 10;

    return this.dashboardService.getArtistStats({ from, to }, limit);
  }

  @Get("comments/stats")
  @ApiOperation({
    summary: "Thống kê bình luận: tổng số, bài hát có nhiều bình luận nhất.",
  })
  @ApiQuery({ name: "from", required: false, type: String })
  @ApiQuery({ name: "to", required: false, type: String })
  @ApiQuery({ name: "limit", required: false, type: Number })
  async getCommentStats(
    @Query() query: DashboardFilterQuery,
  ): Promise<CommentStatsDto> {
    const from = query.from ? new Date(query.from) : undefined;
    const to = query.to ? new Date(query.to) : undefined;
    const limit = query.limit ? parseInt(query.limit, 10) : 10;

    return this.dashboardService.getCommentStats({ from, to }, limit);
  }

  @Get("subscriptions/stats")
  @ApiOperation({
    summary: "Thống kê gói nâng cấp: số lượng, doanh thu, đăng ký/hủy.",
  })
  @ApiQuery({ name: "from", required: false, type: String })
  @ApiQuery({ name: "to", required: false, type: String })
  async getSubscriptionStats(
    @Query() query: DashboardFilterQuery,
  ): Promise<SubscriptionStatsDto> {
    const from = query.from ? new Date(query.from) : undefined;
    const to = query.to ? new Date(query.to) : undefined;

    return this.dashboardService.getSubscriptionStats({ from, to });
  }

  @Get("genres/stats")
  @ApiOperation({
    summary: "Thống kê thể loại nhạc: số lượng bài hát, lượt nghe theo thể loại.",
  })
  @ApiQuery({ name: "from", required: false, type: String })
  @ApiQuery({ name: "to", required: false, type: String })
  async getGenreStats(
    @Query() query: DashboardFilterQuery,
  ): Promise<GenreStatsDto> {
    const from = query.from ? new Date(query.from) : undefined;
    const to = query.to ? new Date(query.to) : undefined;

    return this.dashboardService.getGenreStats({ from, to });
  }
}


