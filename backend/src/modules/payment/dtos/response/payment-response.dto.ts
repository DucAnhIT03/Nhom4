import { PaymentMethod, PaymentStatus } from "../../../../shared/schemas/payment.schema";

export class PaymentResponseDto {
  id!: number;
  userId!: number;
  planId!: number;
  transactionId?: string;
  amount!: number;
  paymentMethod!: PaymentMethod;
  paymentStatus!: PaymentStatus;
  paymentDate!: Date;
  createdAt!: Date;
  updatedAt!: Date;
}


