import { Column, Entity, PrimaryColumn } from "typeorm";

/**
 * wishlists
 * Danh sách bài hát yêu thích (user-song, khóa chính phức hợp).
 */
@Entity({ name: "wishlists" })
export class Wishlist {
  @PrimaryColumn({ name: "user_id", type: "int" })
  userId!: number;

  @PrimaryColumn({ name: "song_id", type: "int" })
  songId!: number;
}


