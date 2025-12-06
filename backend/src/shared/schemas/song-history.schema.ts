import { Column, Entity, PrimaryColumn } from "typeorm";

/**
 * song_histories
 * Lịch sử phát bài nhạc của người dùng.
 */
@Entity({ name: "song_histories" })
export class SongHistory {
  @PrimaryColumn({ name: "user_id", type: "int" })
  userId!: number;

  @PrimaryColumn({ name: "song_id", type: "int" })
  songId!: number;

  @PrimaryColumn({ name: "played_at", type: "datetime" })
  playedAt!: Date;
}


