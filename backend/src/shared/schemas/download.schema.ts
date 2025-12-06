import { Column, CreateDateColumn, Entity, PrimaryColumn } from "typeorm";

/**
 * downloads
 * Bài nhạc đã tải về của người dùng.
 */
@Entity({ name: "downloads" })
export class Download {
  @PrimaryColumn({ name: "user_id", type: "int" })
  userId!: number;

  @PrimaryColumn({ name: "song_id", type: "int" })
  songId!: number;

  @CreateDateColumn({ name: "added_at" })
  addedAt!: Date;
}


