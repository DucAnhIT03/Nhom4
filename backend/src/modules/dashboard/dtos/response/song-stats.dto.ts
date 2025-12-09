export class TopSong {
  id!: number;
  title!: string;
  artistName!: string;
  views!: number;
  favoriteCount!: number;
  commentCount!: number;
  createdAt!: Date;
}

export class SongStatsDto {
  totalSongs!: number;
  totalViews!: number;
  totalFavorites!: number;
  totalComments!: number;
  topSongsByViews!: TopSong[];
  topSongsByFavorites!: TopSong[];
  topSongsByComments!: TopSong[];
  songsByType!: {
    FREE: number;
    PREMIUM: number;
  };
}

