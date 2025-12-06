import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Artist } from "./artist.schema";
import { Genre } from "./genre.schema";

export enum AlbumType {
  FREE = "FREE",
  PREMIUM = "PREMIUM",
}

/**
 * albums
 * Tập hợp bài hát.
 * Album có thể thuộc về nghệ sĩ (artistId) hoặc thể loại nhạc (genreId)
 */
@Entity({ name: "albums" })
export class Album {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 255, nullable: false })
  title!: string;

  @Column({ name: "release_date", type: "datetime", nullable: true })
  releaseDate?: Date;

  @Column({ name: "artist_id", type: "int", nullable: true })
  artistId?: number;

  @ManyToOne(() => Artist)
  @JoinColumn({ name: "artist_id" })
  artist?: Artist;

  @Column({ name: "genre_id", type: "int", nullable: true })
  genreId?: number;

  @ManyToOne(() => Genre)
  @JoinColumn({ name: "genre_id" })
  genre?: Genre;

  @Column({ name: "cover_image", length: 255, nullable: true })
  coverImage?: string;

  @Column({ name: "background_music", length: 255, nullable: true })
  backgroundMusic?: string;

  @Column({ type: "enum", enum: AlbumType, nullable: false })
  type!: AlbumType;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}


