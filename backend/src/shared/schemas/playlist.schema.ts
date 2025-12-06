import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

/**
 * playlists
 * Danh sách phát của người dùng.
 */
@Entity({ name: "playlists" })
export class Playlist {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 255, nullable: false })
  name!: string;

  @Column({ name: "user_id", type: "int", nullable: false })
  userId!: number;

  @Column({ name: "is_public", type: "bit", default: 0 })
  isPublic!: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}


