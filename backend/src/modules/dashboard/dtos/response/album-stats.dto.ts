import { AlbumType } from "../../../../shared/schemas/album.schema";

export class TopAlbum {
  id!: number;
  title!: string;
  artistName?: string;
  songCount!: number;
  totalViews!: number;
  releaseDate?: Date;
  type!: AlbumType;
}

export class AlbumStatsDto {
  totalAlbums!: number;
  albumsByType!: Record<AlbumType, number>;
  topAlbumsBySongs!: TopAlbum[];
  topAlbumsByViews!: TopAlbum[];
  albumsByArtist!: Array<{
    artistId: number;
    artistName: string;
    albumCount: number;
  }>;
  albumsByMonth!: Array<{
    month: string;
    count: number;
  }>;
}

