import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export enum SubscriptionPlanType {
  FREE = "FREE",
  PRENIUM = "PRENIUM",
  AIRTIST = "AIRTIST",
}

export enum SubscriptionStatus {
  ACTIVE = "ACTIVE",
  EXPIRED = "EXPIRED",
  CANCELLED = "CANCELLED",
}

/**
 * subscriptions
 * Gói đã mua của người dùng.
 */
@Entity({ name: "subscriptions" })
export class Subscription {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "user_id", type: "int", nullable: false })
  userId!: number;

  @Column({ name: "plan", type: "enum", enum: SubscriptionPlanType, nullable: false })
  plan!: SubscriptionPlanType;

  @Column({ name: "start_time", type: "datetime", nullable: true })
  startTime?: Date;

  @Column({ name: "end_time", type: "datetime", nullable: true })
  endTime?: Date;

  @Column({ type: "enum", enum: SubscriptionStatus, nullable: false })
  status!: SubscriptionStatus;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}


