import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { SubscriptionPlanService } from "../services/subscription-plan.service";
import { CreateSubscriptionPlanDto } from "../dtos/request/create-subscription-plan.dto";
import { UpdateSubscriptionPlanDto } from "../dtos/request/update-subscription-plan.dto";
import { QuerySubscriptionPlanDto } from "../dtos/request/query-subscription-plan.dto";

@ApiTags("Gói subscription")
@Controller("subscription-plans")
export class SubscriptionPlanController {
  constructor(private readonly subscriptionPlanService: SubscriptionPlanService) {}

  @ApiOperation({ summary: "Lấy danh sách gói subscription (có tìm kiếm & phân trang)" })
  @Get()
  findAll(@Query() query: QuerySubscriptionPlanDto) {
    return this.subscriptionPlanService.findAll(query);
  }

  @ApiOperation({ summary: "Lấy chi tiết một gói subscription" })
  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.subscriptionPlanService.findOne(id);
  }

  @ApiOperation({ summary: "Tạo mới một gói subscription" })
  @Post()
  create(@Body() dto: CreateSubscriptionPlanDto) {
    return this.subscriptionPlanService.create(dto);
  }

  @ApiOperation({ summary: "Cập nhật thông tin gói subscription" })
  @Patch(":id")
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateSubscriptionPlanDto) {
    return this.subscriptionPlanService.update(id, dto);
  }

  @ApiOperation({ summary: "Xóa một gói subscription" })
  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.subscriptionPlanService.remove(id);
  }
}


