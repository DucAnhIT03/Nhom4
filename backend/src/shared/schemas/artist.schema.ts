import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

/**
 * artists
 * Nghệ sĩ trong hệ thống.
 */
@Entity({ name: "artists" })
export class Artist {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "artist_name", length: 255, nullable: false })
  artistName!: string;

  @Column({ name: "bio", type: "longtext", nullable: true })
  bio?: string;

  @Column({ name: "avatar", length: 255, nullable: true })
  avatar?: string;

  @Column({ length: 100, nullable: true })
  nationality?: string;

  @Column({ type: "int", nullable: true })
  age?: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}

