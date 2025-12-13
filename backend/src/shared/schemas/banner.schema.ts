import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Song } from "./song.schema";

/**
 * banners
 * Banner quảng cáo/hiển thị trên trang chủ.
 */
@Entity({ name: "banners" })
export class Banner {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 255, nullable: false })
  title!: string;

  @Column({ name: "image_url", length: 255, nullable: false })
  imageUrl!: string;

  @Column({ type: "longtext", nullable: true })
  content?: string;

  @Column({ name: "song_id", type: "int", nullable: true })
  songId?: number;

  @ManyToOne(() => Song)
  @JoinColumn({ name: "song_id" })
  song?: Song;

  @Column({ name: "is_active", type: "boolean", nullable: false, default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}

