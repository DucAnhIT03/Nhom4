import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { PaymentMethod } from "../../../../shared/schemas/payment.schema";

export class CreatePaymentDto {
  @IsInt()
  userId!: number;

  @IsInt()
  planId!: number;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  transactionId?: string;
}


