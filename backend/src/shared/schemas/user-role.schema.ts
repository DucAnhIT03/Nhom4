import { Column, Entity, PrimaryColumn } from "typeorm";

/**
 * USER_ROLE
 * Bảng trung gian gán quyền cho người dùng.
 * Khóa chính phức hợp (userId, roleId).
 */
@Entity({ name: "USER_ROLE" })
export class UserRole {
  @PrimaryColumn({ name: "user_id", type: "int" })
  userId!: number;

  @PrimaryColumn({ name: "role_id", type: "int" })
  roleId!: number;
}



