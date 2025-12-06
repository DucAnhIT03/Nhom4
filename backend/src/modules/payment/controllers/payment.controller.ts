import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { PaymentService } from "../services/payment.service";
import { CreatePaymentDto } from "../dtos/request/create-payment.dto";
import { QueryPaymentDto } from "../dtos/request/query-payment.dto";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { AuthGuard } from "../../../common/guards/auth.guard";

@ApiTags("Thanh toán & gói VIP")
@Controller("payments")
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @ApiOperation({ summary: "Tạo một giao dịch thanh toán mới" })
  @Post()
  create(@Body() dto: CreatePaymentDto) {
    return this.paymentService.create(dto);
  }

  /**
   * Lịch sử thanh toán của user hiện tại (dựa trên JWT).
   */
  @ApiOperation({ summary: "Lấy lịch sử thanh toán của user hiện tại" })
  @ApiBearerAuth("access-token")
  @UseGuards(AuthGuard)
  @Get("me")
  findMyPayments(@CurrentUser() user: { id: number }) {
    return this.paymentService.findByUser(user.id);
  }

  @ApiOperation({ summary: "Lấy lịch sử thanh toán theo userId" })
  @Get("user/:userId")
  findByUser(@Param("userId", ParseIntPipe) userId: number) {
    return this.paymentService.findByUser(userId);
  }

  /**
   * Danh sách thanh toán cho admin với tìm kiếm + phân trang.
   * Query hỗ trợ:
   * - userId, planId, paymentMethod, paymentStatus
   * - search: tìm theo transactionId (LIKE %search%)
   * - page, limit: phân trang
   */
  @ApiOperation({ summary: "Danh sách thanh toán (dành cho admin) với tìm kiếm & phân trang" })
  @Get("admin")
  findAllForAdmin(@Query() query: QueryPaymentDto) {
    return this.paymentService.findAllForAdmin(query);
  }
}

