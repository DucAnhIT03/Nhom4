import { Column, CreateDateColumn, Entity, PrimaryColumn } from "typeorm";

/**
 * playlist_song
 * Bài hát trong playlist.
 */
@Entity({ name: "playlist_song" })
export class PlaylistSong {
  @PrimaryColumn({ name: "playlist_id", type: "int" })
  playlistId!: number;

  @PrimaryColumn({ name: "song_id", type: "int" })
  songId!: number;

  @CreateDateColumn({ name: "added_at" })
  addedAt!: Date;
}


