import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

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

  @Column({ name: "album_id", type: "int", nullable: false })
  albumId!: number;

  @Column({ name: "file_url", length: 255, nullable: true })
  fileUrl?: string;

  @Column({ type: "int", nullable: false, default: 0 })
  views!: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}


