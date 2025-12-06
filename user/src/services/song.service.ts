import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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
  artist?: {
    id: number;
    artistName: string;
  };
}

export const incrementSongViews = async (songId: number): Promise<Song> => {
  const response = await axios.post<Song>(`${API_BASE_URL}/songs/${songId}/increment-views`);
  return response.data;
};

export const getSongsByGenreName = async (genreName: string): Promise<Song[]> => {
  try {
    const response = await axios.get<Song[]>(`${API_BASE_URL}/genres/name/${encodeURIComponent(genreName)}/songs`);
    return response.data;
  } catch (error) {
    console.error('Error fetching songs by genre:', error);
    return [];
  }
};

export const getSongsByArtistId = async (artistId: number): Promise<Song[]> => {
  try {
    const response = await axios.get<Song[]>(`${API_BASE_URL}/songs/artist/${artistId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching songs by artist:', error);
    return [];
  }
};

