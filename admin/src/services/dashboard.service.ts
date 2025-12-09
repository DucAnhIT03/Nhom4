import axios from '../apis/axios';

export interface UserStats {
  totalUsers: number;
  usersByStatus: Record<string, number>;
  usersByPlan: Record<string, number>;
  activeUsers: number;
  blockedUsers: number;
  verifyUsers: number;
  freeUsers: number;
  premiumUsers: number;
  artistUsers: number;
}

export interface TopSong {
  id: number;
  title: string;
  artistName: string;
  views: number;
  favoriteCount: number;
  commentCount: number;
  createdAt: string;
}

export interface SongStats {
  totalSongs: number;
  totalViews: number;
  totalFavorites: number;
  totalComments: number;
  topSongsByViews: TopSong[];
  topSongsByFavorites: TopSong[];
  topSongsByComments: TopSong[];
  songsByType: {
    FREE: number;
    PREMIUM: number;
  };
}

export interface TopAlbum {
  id: number;
  title: string;
  artistName?: string;
  songCount: number;
  totalViews: number;
  releaseDate?: string;
  type: string;
}

export interface AlbumStats {
  totalAlbums: number;
  albumsByType: Record<string, number>;
  topAlbumsBySongs: TopAlbum[];
  topAlbumsByViews: TopAlbum[];
  albumsByArtist: Array<{
    artistId: number;
    artistName: string;
    albumCount: number;
  }>;
  albumsByMonth: Array<{
    month: string;
    count: number;
  }>;
}

export interface TopArtist {
  id: number;
  artistName: string;
  albumCount: number;
  songCount: number;
  totalViews: number;
}

export interface ArtistStats {
  totalArtists: number;
  topArtistsByAlbums: TopArtist[];
  topArtistsBySongs: TopArtist[];
  topArtistsByViews: TopArtist[];
}

export interface TopCommentedSong {
  songId: number;
  songTitle: string;
  artistName: string;
  commentCount: number;
}

export interface CommentStats {
  totalComments: number;
  topCommentedSongs: TopCommentedSong[];
  commentsByMonth: Array<{
    month: string;
    count: number;
  }>;
  recentComments: Array<{
    id: number;
    content: string;
    userName: string;
    songTitle: string;
    createdAt: string;
  }>;
}

export interface SubscriptionRevenue {
  plan: string;
  revenue: number;
  count: number;
}

export interface SubscriptionStats {
  totalSubscriptions: number;
  subscriptionsByPlan: Record<string, number>;
  subscriptionsByStatus: Record<string, number>;
  totalRevenue: number;
  revenueByPlan: SubscriptionRevenue[];
  subscriptionsByMonth: Array<{
    month: string;
    subscriptions: number;
    cancellations: number;
    revenue: number;
  }>;
}

export interface GenreStat {
  genreId: number;
  genreName: string;
  songCount: number;
  totalViews: number;
}

export interface GenreStats {
  totalGenres: number;
  genresBySongCount: GenreStat[];
  genresByViews: GenreStat[];
}

export interface DashboardFilter {
  from?: string;
  to?: string;
  limit?: number;
}

export const getUserStats = async (filter?: DashboardFilter) => {
  const response = await axios.get<UserStats>('/dashboard/users/stats', {
    params: filter,
  });
  return response.data;
};

export const getSongStats = async (filter?: DashboardFilter) => {
  const response = await axios.get<SongStats>('/dashboard/songs/stats', {
    params: filter,
  });
  return response.data;
};

export const getAlbumStats = async (filter?: DashboardFilter) => {
  const response = await axios.get<AlbumStats>('/dashboard/albums/stats', {
    params: filter,
  });
  return response.data;
};

export const getArtistStats = async (filter?: DashboardFilter) => {
  const response = await axios.get<ArtistStats>('/dashboard/artists/stats', {
    params: filter,
  });
  return response.data;
};

export const getCommentStats = async (filter?: DashboardFilter) => {
  const response = await axios.get<CommentStats>('/dashboard/comments/stats', {
    params: filter,
  });
  return response.data;
};

export const getSubscriptionStats = async (filter?: DashboardFilter) => {
  const response = await axios.get<SubscriptionStats>('/dashboard/subscriptions/stats', {
    params: filter,
  });
  return response.data;
};

export const getGenreStats = async (filter?: DashboardFilter) => {
  const response = await axios.get<GenreStats>('/dashboard/genres/stats', {
    params: filter,
  });
  return response.data;
};

