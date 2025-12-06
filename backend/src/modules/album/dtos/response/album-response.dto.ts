import { AlbumType } from "../../../../shared/schemas/album.schema";

export class AlbumResponseDto {
  id!: number;
  title!: string;
  releaseDate?: Date;
  artistId?: number;
  genreId?: number;
  coverImage?: string;
  type!: AlbumType;
  createdAt!: Date;
  updatedAt!: Date;
  artist?: {
    id: number;
    artistName: string;
  };
  genre?: {
    id: number;
    genreName: string;
  };
}


