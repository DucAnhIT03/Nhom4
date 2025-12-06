import { Column, Entity, PrimaryColumn } from "typeorm";

/**
 * song_genre
 * Liên kết bài nhạc với thể loại (nhiều-nhiều).
 */
@Entity({ name: "song_genre" })
export class SongGenre {
  @PrimaryColumn({ name: "song_id", type: "int" })
  songId!: number;

  @PrimaryColumn({ name: "genre_id", type: "int" })
  genreId!: number;
}


