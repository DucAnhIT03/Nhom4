import axios from '../apis/axios';

export interface Song {
  id: number;
  title: string;
  duration?: string;
  artistId: number;
  albumId?: number;
  fileUrl?: string;
  views: number;
  createdAt?: string;
  updatedAt?: string;
  // Extended fields from relations
  artist?: {
    id: number;
    artistName: string;
  };
  album?: {
    id: number;
    title: string;
  };
}

export interface CreateSongDto {
  title: string;
  artistId: number;
  albumId?: number;
  fileUrl: string; // Bắt buộc vì phải upload file
}

export interface UpdateSongDto {
  title?: string;
  artistId?: number;
  albumId?: number;
  fileUrl?: string;
}

export const getSongs = async () => {
  const response = await axios.get<Song[]>('/songs');
  return response.data;
};

export const getSongById = async (id: number) => {
  const response = await axios.get<Song>(`/songs/${id}`);
  return response.data;
};

export const createSong = async (data: CreateSongDto) => {
  const response = await axios.post<Song>('/songs', data);
  return response.data;
};

export const updateSong = async (id: number, data: UpdateSongDto) => {
  const response = await axios.patch<Song>(`/songs/${id}`, data);
  return response.data;
};

export const deleteSong = async (id: number) => {
  const response = await axios.delete(`/songs/${id}`);
  return response.data;
};

export const getSongsByArtistId = async (artistId: number) => {
  const response = await axios.get<Song[]>(`/songs/artist/${artistId}`);
  return response.data;
};

