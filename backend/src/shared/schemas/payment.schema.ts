import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export enum PaymentMethod {
  PAYPAL = "PAYPAL",
  CREDIT_CARD = "CREDIT_CARD",
  MOMO = "MOMO",
  ZALO_PAY = "ZALO_PAY",
}

export enum PaymentStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
}

/**
 * payments
 * Thanh toán gói subscription.
 */
@Entity({ name: "payments" })
export class Payment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "user_id", type: "int", nullable: false })
  userId!: number;

  @Column({ name: "plan_id", type: "int", nullable: false })
  planId!: number;

  @Column({ name: "transaction_id", length: 255, nullable: true })
  transactionId?: string;

  @Column({ type: "double", nullable: false })
  amount!: number;

  @Column({
    name: "payment_method",
    type: "enum",
    enum: PaymentMethod,
    nullable: false,
  })
  paymentMethod!: PaymentMethod;

  @Column({
    name: "payment_status",
    type: "enum",
    enum: PaymentStatus,
    nullable: false,
  })
  paymentStatus!: PaymentStatus;

  @Column({ name: "payment_date", type: "datetime", nullable: false })
  paymentDate!: Date;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}

