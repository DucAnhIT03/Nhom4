export class TopArtist {
  id!: number;
  artistName!: string;
  albumCount!: number;
  songCount!: number;
  totalViews!: number;
}

export class ArtistStatsDto {
  totalArtists!: number;
  topArtistsByAlbums!: TopArtist[];
  topArtistsBySongs!: TopArtist[];
  topArtistsByViews!: TopArtist[];
}

