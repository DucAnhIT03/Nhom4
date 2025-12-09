export class TopCommentedSong {
  songId!: number;
  songTitle!: string;
  artistName!: string;
  commentCount!: number;
}

export class CommentStatsDto {
  totalComments!: number;
  topCommentedSongs!: TopCommentedSong[];
  commentsByMonth!: Array<{
    month: string;
    count: number;
  }>;
  recentComments!: Array<{
    id: number;
    content: string;
    userName: string;
    songTitle: string;
    createdAt: Date;
  }>;
}

