import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from "typeorm";

@Entity("otps")
export class Otp {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 255 })
  @Index()
  email!: string;

  @Column({ type: "varchar", length: 6 })
  code!: string;

  @Column({ type: "enum", enum: ["REGISTER", "RESET_PASSWORD"], default: "REGISTER" })
  type!: "REGISTER" | "RESET_PASSWORD";

  @Column({ name: "is_used", type: "boolean", default: false })
  isUsed!: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @Column({ name: "expires_at", type: "datetime" })
  expiresAt!: Date;
}

