import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

/**
 * subscription_plan
 * Bảng cấu hình giá gói.
 */
@Entity({ name: "subscription_plan" })
export class SubscriptionPlan {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "plan_name", length: 255, nullable: false })
  planName!: string;

  @Column({ type: "double", nullable: false })
  price!: number;

  @Column({ name: "duration_day", type: "int", nullable: false })
  durationDay!: number;

  @Column({ type: "longtext", nullable: true })
  description?: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}


