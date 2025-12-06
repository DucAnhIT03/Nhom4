import axios from '../apis/axios';
import type { Song } from './song.service';

export interface Album {
  id: number;
  title: string;
  releaseDate?: string;
  coverImage?: string;
  backgroundMusic?: string;
  artistId?: number;
  genreId?: number;
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

export interface CreateAlbumDto {
  title: string;
  releaseDate?: string;
  artistId?: number;
  genreId?: number;
  coverImage?: string;
  backgroundMusic?: string;
  type: 'FREE' | 'PREMIUM';
}

export interface UpdateAlbumDto {
  title?: string;
  releaseDate?: string;
  artistId?: number;
  genreId?: number;
  coverImage?: string;
  backgroundMusic?: string;
  type?: 'FREE' | 'PREMIUM';
}

export const getAlbums = async () => {
  const response = await axios.get<Album[]>('/albums');
  return response.data;
};

export const getAlbumById = async (id: number) => {
  const response = await axios.get<Album>(`/albums/${id}`);
  return response.data;
};

export const createAlbum = async (data: CreateAlbumDto) => {
  const response = await axios.post<Album>('/albums', data);
  return response.data;
};

export const updateAlbum = async (id: number, data: UpdateAlbumDto) => {
  const response = await axios.patch<Album>(`/albums/${id}`, data);
  return response.data;
};

export const deleteAlbum = async (id: number) => {
  const response = await axios.delete(`/albums/${id}`);
  return response.data;
};

export const getSongsByAlbumId = async (albumId: number) => {
  const response = await axios.get<Song[]>(`/albums/${albumId}/songs`);
  return response.data;
};

