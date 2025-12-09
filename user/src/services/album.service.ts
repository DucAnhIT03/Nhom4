import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface Album {
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
  artist?: {
    id: number;
    artistName: string;
  };
  genre?: {
    id: number;
    genreName: string;
  };
}

export interface Song {
  id: number;
  title: string;
  duration?: string;
  artistId: number;
  albumId?: number;
  fileUrl?: string;
  type?: 'FREE' | 'PREMIUM';
  views: number;
  createdAt?: string;
  updatedAt?: string;
  artist?: {
    id: number;
    artistName: string;
  };
}

export const getAlbums = async (): Promise<Album[]> => {
  const response = await axios.get<Album[]>(`${API_BASE_URL}/albums`);
  return response.data;
};

export const getTrendingAlbums = async (limit: number = 10): Promise<Album[]> => {
  const response = await axios.get<Album[]>(`${API_BASE_URL}/albums/trending`, {
    params: { limit },
  });
  return response.data;
};

export const getAlbumById = async (id: number): Promise<Album> => {
  const response = await axios.get<Album>(`${API_BASE_URL}/albums/${id}`);
  return response.data;
};

export const getSongsByAlbumId = async (albumId: number): Promise<Song[]> => {
  const response = await axios.get<Song[]>(`${API_BASE_URL}/albums/${albumId}/songs`);
  return response.data;
};

export const getAlbumsByArtistId = async (artistId: number): Promise<Album[]> => {
  const response = await axios.get<Album[]>(`${API_BASE_URL}/albums/artist/${artistId}`);
  return response.data;
};

