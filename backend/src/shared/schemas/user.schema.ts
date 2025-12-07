import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export enum UserStatus {
  VERIFY = "VERIFY",
  ACTIVE = "ACTIVE",
  BLOCKED = "BLOCKED",
}

/**
 * users
 * Đại diện bản ghi người dùng trong hệ thống.
 */
@Entity({ name: "users" })
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "first_name", length: 100, nullable: false })
  firstName!: string;

  @Column({ name: "last_name", length: 100, nullable: false })
  lastName!: string;

  @Column({ length: 255, nullable: false })
  email!: string;

  @Column({ length: 255, nullable: false })
  password!: string;

  @Column({ name: "profile_image", length: 255, nullable: true })
  profileImage?: string;

  @Column({ type: "int", nullable: true })
  age?: number;

  @Column({ length: 100, nullable: true })
  nationality?: string;

  @Column({ type: "longtext", nullable: true })
  bio?: string;

  @Column({ type: "enum", enum: UserStatus, default: UserStatus.VERIFY })
  status!: UserStatus;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}

