import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { DashboardService } from "../services/dashboard.service";
import { AdminDashboardStatsDto } from "../dtos/response/admin-dashboard-stats.dto";
import { AuthGuard } from "../../../common/guards/auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";
import { Roles } from "../../../common/decorators/roles.decorator";
import { RoleName } from "../../../shared/schemas/role.schema";

class DashboardFilterQuery {
  from?: string;
  to?: string;
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
}


