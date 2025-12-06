import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { SubscriptionService } from "../services/subscription.service";
import { CreateSubscriptionDto } from "../dtos/request/create-subscription.dto";
import { UpdateSubscriptionDto } from "../dtos/request/update-subscription.dto";

@ApiTags("Subscription của người dùng")
@Controller("subscriptions")
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @ApiOperation({ summary: "Lấy danh sách tất cả subscription" })
  @Get()
  findAll() {
    return this.subscriptionService.findAll();
  }

  @ApiOperation({ summary: "Lấy chi tiết một subscription" })
  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.subscriptionService.findOne(id);
  }

  @ApiOperation({ summary: "Lấy subscription hiện tại của một user" })
  @Get("user/:userId")
  findByUser(@Param("userId", ParseIntPipe) userId: number) {
    return this.subscriptionService.findByUser(userId);
  }

  @ApiOperation({ summary: "Tạo mới subscription cho user" })
  @Post()
  create(@Body() dto: CreateSubscriptionDto) {
    return this.subscriptionService.create(dto);
  }

  @ApiOperation({ summary: "Cập nhật subscription" })
  @Patch(":id")
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateSubscriptionDto) {
    return this.subscriptionService.update(id, dto);
  }

  @ApiOperation({ summary: "Xóa subscription" })
  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.subscriptionService.remove(id);
  }
}


