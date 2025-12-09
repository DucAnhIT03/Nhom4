export class GenreStat {
  genreId!: number;
  genreName!: string;
  songCount!: number;
  totalViews!: number;
}

export class GenreStatsDto {
  totalGenres!: number;
  genresBySongCount!: GenreStat[];
  genresByViews!: GenreStat[];
}

