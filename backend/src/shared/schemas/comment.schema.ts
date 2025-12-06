import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

/**
 * comments
 * Bình luận cho bài nhạc.
 */
@Entity({ name: "comments" })
export class Comment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "user_id", type: "int", nullable: false })
  userId!: number;

  @Column({ name: "song_id", type: "int", nullable: false })
  songId!: number;

  @Column({ length: 255, nullable: false })
  content!: string;

  @Column({ name: "parent_id", type: "int", nullable: true })
  parentId?: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}


