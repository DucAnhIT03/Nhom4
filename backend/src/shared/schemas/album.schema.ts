import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export enum AlbumType {
  FREE = "FREE",
  PREMIUM = "PREMIUM",
}

/**
 * albums
 * Tập hợp bài hát.
 */
@Entity({ name: "albums" })
export class Album {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 255, nullable: false })
  title!: string;

  @Column({ name: "release_date", type: "datetime", nullable: true })
  releaseDate?: Date;

  @Column({ name: "artist_id", type: "int", nullable: false })
  artistId!: number;

  @Column({ name: "cover_image", length: 255, nullable: true })
  coverImage?: string;

  @Column({ type: "enum", enum: AlbumType, nullable: false })
  type!: AlbumType;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}


