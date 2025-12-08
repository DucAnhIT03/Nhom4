import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Lấy token từ localStorage
const getAuthToken = () => {
  return localStorage.getItem('token');
};

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Thêm interceptor để tự động thêm token
axiosInstance.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Thêm interceptor để xử lý lỗi 401 (Unauthorized)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token không hợp lệ hoặc đã hết hạn, xóa token và redirect về trang đăng nhập
      localStorage.clear();
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export interface MyAlbum {
  id: number;
  title: string;
  releaseDate?: string;
  artistId?: number;
  genreId?: number;
  coverImage?: string;
  backgroundMusic?: string;
  type: 'FREE' | 'PREMIUM';
  createdAt?: string;
  updatedAt?: string;
  songCount?: number;
  artist?: {
    id: number;
    artistName: string;
  };
  genre?: {
    id: number;
    genreName: string;
  };
}

export interface MySong {
  id: number;
  title: string;
  duration?: string;
  artistId: number;
  albumId?: number;
  fileUrl?: string;
  views: number;
  type?: 'FREE' | 'PREMIUM';
  createdAt?: string;
  updatedAt?: string;
  artist?: {
    id: number;
    artistName: string;
  };
}

export interface CreateAlbumDto {
  title: string;
  releaseDate?: string;
  coverImage?: string;
  type?: 'FREE' | 'PREMIUM';
  genreId?: number;
}

export interface UpdateAlbumDto {
  title?: string;
  releaseDate?: string;
  coverImage?: string;
  type?: 'FREE' | 'PREMIUM';
  genreId?: number;
}

export interface CreateSongDto {
  title: string;
  duration?: string;
  fileUrl?: string;
  genreId?: number;
  type?: 'FREE' | 'PREMIUM';
}

export interface UpdateSongDto {
  title?: string;
  duration?: string;
  fileUrl?: string;
  genreId?: number;
  albumId?: number;
  coverImage?: string;
  type?: 'FREE' | 'PREMIUM';
}

export interface MyAlbumsResponse {
  data: MyAlbum[];
  total: number;
  page: number;
  limit: number;
}

export interface MySongsResponse {
  data: MySong[];
  total: number;
  page: number;
  limit: number;
}

// Album APIs
export const getMyAlbums = async (
  page: number = 1,
  limit: number = 10,
  search?: string
): Promise<MyAlbumsResponse> => {
  const response = await axiosInstance.get<MyAlbumsResponse>('/artist/my-content/albums', {
    params: { page, limit, search },
  });
  return response.data;
};

export const createMyAlbum = async (data: CreateAlbumDto): Promise<MyAlbum> => {
  const response = await axiosInstance.post<MyAlbum>('/artist/my-content/albums', data);
  return response.data;
};

export const updateMyAlbum = async (id: number, data: UpdateAlbumDto): Promise<MyAlbum> => {
  const response = await axiosInstance.put<MyAlbum>(`/artist/my-content/albums/${id}`, data);
  return response.data;
};

export const deleteMyAlbum = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/artist/my-content/albums/${id}`);
};

// Song APIs - Get all songs
export const getMySongs = async (
  page: number = 1,
  limit: number = 10,
  search?: string
): Promise<MySongsResponse> => {
  const response = await axiosInstance.get<MySongsResponse>('/artist/my-content/songs', {
    params: { page, limit, search },
  });
  return response.data;
};

// Song APIs - Album songs
export const getMyAlbumSongs = async (albumId: number): Promise<MySong[]> => {
  const response = await axiosInstance.get<MySong[]>(`/artist/my-content/albums/${albumId}/songs`);
  return response.data;
};

export const addSongToMyAlbum = async (albumId: number, data: CreateSongDto): Promise<MySong> => {
  const response = await axiosInstance.post<MySong>(`/artist/my-content/albums/${albumId}/songs`, data);
  return response.data;
};

export const createMySong = async (data: CreateSongDto): Promise<MySong> => {
  const response = await axiosInstance.post<MySong>('/artist/my-content/songs', data);
  return response.data;
};

export const updateMySong = async (id: number, data: UpdateSongDto): Promise<MySong> => {
  const response = await axiosInstance.put<MySong>(`/artist/my-content/songs/${id}`, data);
  return response.data;
};

export const deleteMySong = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/artist/my-content/songs/${id}`);
};

