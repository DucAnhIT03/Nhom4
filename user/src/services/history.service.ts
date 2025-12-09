import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface HistoryItem {
  song: {
    id: number;
    title: string;
    duration?: string;
    artistId: number;
    albumId?: number;
    fileUrl?: string;
    coverImage?: string;
    type?: 'FREE' | 'PREMIUM';
    views: number;
    createdAt?: string;
    updatedAt?: string;
    artist?: {
      id: number;
      artistName: string;
    };
  };
  history: {
    userId: number;
    songId: number;
    playedAt: string;
  };
}

export interface AddHistoryDto {
  userId: number;
  songId: number;
}

/**
 * Lấy lịch sử nghe bài hát của user (unique - không trùng lặp)
 */
export const getHistory = async (userId: number): Promise<HistoryItem[]> => {
  const token = localStorage.getItem('token');
  const response = await axios.get<HistoryItem[]>(
    `${API_BASE_URL}/library/history/${userId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

/**
 * Thêm bài hát vào lịch sử nghe
 */
export const addHistory = async (userId: number, songId: number): Promise<void> => {
  const token = localStorage.getItem('token');
  await axios.post(
    `${API_BASE_URL}/library/history`,
    { userId, songId },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

export interface MostPlayedItem {
  song: {
    id: number;
    title: string;
    duration?: string;
    artistId: number;
    albumId?: number;
    fileUrl?: string;
    coverImage?: string;
    type?: 'FREE' | 'PREMIUM';
    views: number;
    createdAt?: string;
    updatedAt?: string;
    artist?: {
      id: number;
      artistName: string;
    };
  };
  playCount: number;
}

/**
 * Lấy danh sách bài hát nghe nhiều nhất của user (playlist)
 */
export const getMostPlayedSongs = async (userId: number): Promise<MostPlayedItem[]> => {
  const token = localStorage.getItem('token');
  const response = await axios.get<MostPlayedItem[]>(
    `${API_BASE_URL}/library/most-played/${userId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

export interface FavoriteGenresPopularItem {
  song: {
    id: number;
    title: string;
    duration?: string;
    artistId: number;
    albumId?: number;
    fileUrl?: string;
    coverImage?: string;
    type?: 'FREE' | 'PREMIUM';
    views: number;
    createdAt?: string;
    updatedAt?: string;
    artist?: {
      id: number;
      artistName: string;
    };
  };
  playCount: number;
}

/**
 * Lấy danh sách bài hát phổ biến của các thể loại mà user hay nghe
 */
export const getFavoriteGenresPopularSongs = async (userId: number): Promise<FavoriteGenresPopularItem[]> => {
  const token = localStorage.getItem('token');
  const response = await axios.get<FavoriteGenresPopularItem[]>(
    `${API_BASE_URL}/library/favorite-genres-popular/${userId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

