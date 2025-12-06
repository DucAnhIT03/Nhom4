import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * genres
 * Thể loại nhạc.
 */
@Entity({ name: "genres" })
export class Genre {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "genre_name", length: 255, nullable: false })
  genreName!: string;

  @Column({ name: "image_url", length: 255, nullable: true })
  imageUrl?: string;
}


