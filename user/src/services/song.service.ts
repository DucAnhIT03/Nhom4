import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface Song {
  id: number;
  title: string;
  duration?: string;
  artistId: number;
  albumId?: number;
  fileUrl?: string;
  coverImage?: string;
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

export const getSongById = async (songId: number): Promise<Song | null> => {
  try {
    const response = await axios.get<Song>(`${API_BASE_URL}/songs/${songId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching song by id:', error);
    return null;
  }
};

export const getAllSongs = async (): Promise<Song[]> => {
  try {
    const response = await axios.get<Song[]>(`${API_BASE_URL}/songs`);
    return response.data;
  } catch (error) {
    console.error('Error fetching all songs:', error);
    return [];
  }
};

export const getNewReleases = async (limit?: number): Promise<Song[]> => {
  try {
    const params = limit ? { limit } : {};
    const response = await axios.get<Song[]>(`${API_BASE_URL}/songs/new-releases`, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching new releases:', error);
    // Fallback: lấy tất cả songs và sắp xếp theo createdAt
    try {
      const allSongs = await getAllSongs();
      const sorted = allSongs
        .filter(song => song.createdAt)
        .sort((a, b) => {
          const dateA = new Date(a.createdAt!).getTime();
          const dateB = new Date(b.createdAt!).getTime();
          return dateB - dateA; // Mới nhất trước
        });
      return limit ? sorted.slice(0, limit) : sorted;
    } catch (fallbackError) {
      console.error('Error in fallback:', fallbackError);
      return [];
    }
  }
};

