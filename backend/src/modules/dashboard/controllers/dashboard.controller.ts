import { Controller, Get, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { DashboardService } from "../services/dashboard.service";
import { AdminDashboardStatsDto } from "../dtos/response/admin-dashboard-stats.dto";

class DashboardFilterQuery {
  from?: string;
  to?: string;
}

@ApiTags("Dashboard quản trị")
@Controller("dashboard")
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
}


