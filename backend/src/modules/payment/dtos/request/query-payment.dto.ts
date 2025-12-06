import { IsEnum, IsInt, IsOptional, IsString, Min } from "class-validator";
import { PaymentMethod, PaymentStatus } from "../../../../shared/schemas/payment.schema";

export class QueryPaymentDto {
  @IsOptional()
  @IsInt()
  userId?: number;

  @IsOptional()
  @IsInt()
  planId?: number;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  /**
   * Tìm kiếm theo transactionId (LIKE %search%)
   */
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}




