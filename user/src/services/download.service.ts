import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface DownloadItem {
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
  download: {
    userId: number;
    songId: number;
    addedAt: string;
  };
}

export interface AddDownloadDto {
  userId: number;
  songId: number;
}

export interface RemoveDownloadDto {
  userId: number;
  songId: number;
}

/**
 * Lấy danh sách bài hát đã tải xuống của user
 */
export const getDownloads = async (userId: number): Promise<DownloadItem[]> => {
  const token = localStorage.getItem('token');
  const response = await axios.get<DownloadItem[]>(
    `${API_BASE_URL}/library/downloads/${userId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

/**
 * Thêm bài hát vào danh sách tải xuống
 */
export const addDownload = async (userId: number, songId: number): Promise<{ isDownloaded: boolean }> => {
  const token = localStorage.getItem('token');
  const response = await axios.post<{ isDownloaded: boolean }>(
    `${API_BASE_URL}/library/downloads`,
    { userId, songId },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

/**
 * Xóa bài hát khỏi danh sách tải xuống
 */
export const removeDownload = async (userId: number, songId: number): Promise<{ isDownloaded: boolean }> => {
  const token = localStorage.getItem('token');
  const response = await axios.delete<{ isDownloaded: boolean }>(
    `${API_BASE_URL}/library/downloads`,
    {
      data: { userId, songId },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

