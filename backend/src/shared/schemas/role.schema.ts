import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

export enum RoleName {
  ADMIN = "ROLE_ADMIN",
  ARTIST = "ROLE_ARTIST",
  USER = "ROLE_USER",
}

/**
 * roles
 * Quyền/vai trò của người dùng.
 */
@Entity({ name: "roles" })
export class Role {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "role_name", type: "enum", enum: RoleName, nullable: false })
  roleName!: RoleName;
}

