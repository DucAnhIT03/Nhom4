import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export interface Genre {
  id: number;
  genreName: string;
  imageUrl?: string;
}

export interface TopGenre {
  genre: Genre;
  songCount: number;
}

export const getGenres = async (): Promise<Genre[]> => {
  try {
    const response = await axios.get<Genre[]>(`${API_BASE_URL}/genres`);
    // Backend đã sắp xếp theo id ASC (thể loại thêm trước hiển thị trước)
    return response.data;
  } catch (error) {
    console.error('Error fetching genres:', error);
    return [];
  }
};

export const getTopGenres = async (limit?: number): Promise<TopGenre[]> => {
  try {
    const params = limit ? { limit: limit.toString() } : {};
    const response = await axios.get<TopGenre[]>(`${API_BASE_URL}/genres/top`, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching top genres:', error);
    return [];
  }
};

