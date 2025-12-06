import { AlbumType } from "../../../../shared/schemas/album.schema";

export class AlbumResponseDto {
  id!: number;
  title!: string;
  releaseDate?: Date;
  artistId!: number;
  coverImage?: string;
  type!: AlbumType;
  createdAt!: Date;
  updatedAt!: Date;
}


