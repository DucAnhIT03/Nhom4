import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Artist } from "./artist.schema";

/**
 * songs
 * Bài nhạc.
 */
@Entity({ name: "songs" })
export class Song {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 255, nullable: false })
  title!: string;

  @Column({ type: "time", nullable: true })
  duration?: string;

  @Column({ name: "artist_id", type: "int", nullable: false })
  artistId!: number;

  @ManyToOne(() => Artist)
  @JoinColumn({ name: "artist_id" })
  artist?: Artist;

  @Column({ name: "album_id", type: "int", nullable: true })
  albumId?: number;

  @Column({ name: "genre_id", type: "int", nullable: true })
  genreId?: number;

  @Column({ name: "cover_image", length: 255, nullable: true })
  coverImage?: string;

  @Column({ name: "file_url", length: 255, nullable: true })
  fileUrl?: string;

  @Column({ type: "longtext", nullable: true })
  description?: string;

  @Column({ type: "longtext", nullable: true })
  lyrics?: string;

  @Column({ type: "enum", enum: ["FREE", "PREMIUM"], nullable: false, default: "FREE" })
  type!: "FREE" | "PREMIUM";

  @Column({ type: "int", nullable: false, default: 0 })
  views!: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}


