import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards, Req, Res } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Request, Response } from "express";
import { PaymentService } from "../services/payment.service";
import { MomoService } from "../services/momo.service";
import { CreatePaymentDto } from "../dtos/request/create-payment.dto";
import { QueryPaymentDto } from "../dtos/request/query-payment.dto";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { AuthGuard } from "../../../common/guards/auth.guard";
import { PaymentMethod } from "../../../shared/schemas/payment.schema";

@ApiTags("Thanh toán & gói VIP")
@Controller("payments")
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly momoService: MomoService,
  ) {}

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

  /**
   * Tạo payment link từ MoMo
   */
  @ApiOperation({ summary: "Tạo payment link từ MoMo" })
  @ApiBearerAuth("access-token")
  @UseGuards(AuthGuard)
  @Post("momo/create")
  async createMomoPayment(
    @CurrentUser() user: { id: number },
    @Body() body: { planId: number; amount: number; planName: string },
  ) {
    const orderId = `ORD${user.id}_${Date.now()}`;
    const orderInfo = `Thanh toán gói ${body.planName}`;

    const paymentLink = await this.momoService.createPaymentLink({
      orderId,
      amount: body.amount,
      orderInfo,
    });

    // Lưu payment vào database với status PENDING
    await this.paymentService.create({
      userId: user.id,
      planId: body.planId,
      amount: body.amount,
      paymentMethod: PaymentMethod.MOMO,
      transactionId: orderId, // Lưu orderId vào transactionId để tìm lại sau
    });

    return {
      payUrl: paymentLink.payUrl,
      orderId: paymentLink.orderId,
      planId: body.planId,
      userId: user.id,
    };
  }

  /**
   * Callback từ MoMo sau khi thanh toán
   */
  @ApiOperation({ summary: "Callback từ MoMo sau khi thanh toán" })
  @Post("momo/callback")
  async momoCallback(@Req() req: Request, @Res() res: Response) {
    const callbackData = req.body;

    // Xác thực signature
    const isValid = this.momoService.verifyCallback(callbackData);

    if (!isValid) {
      return res.status(400).json({ message: "Invalid signature" });
    }

    // Xử lý kết quả thanh toán
    if (callbackData.resultCode === 0) {
      // Thanh toán thành công
      try {
        await this.paymentService.completeMomoPayment(
          callbackData.orderId,
          callbackData.transId,
        );
        return res.status(200).json({
          message: "Payment successful",
          orderId: callbackData.orderId,
          transId: callbackData.transId,
        });
      } catch (error: any) {
        console.error('Error completing MoMo payment:', error);
        return res.status(500).json({ message: error.message });
      }
    } else {
      // Thanh toán thất bại
      return res.status(200).json({
        message: "Payment failed",
        resultCode: callbackData.resultCode,
      });
    }
  }
}

