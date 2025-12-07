import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface Artist {
  id: number;
  artistName: string;
  bio?: string;
  avatar?: string;
  nationality?: string;
  age?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ArtistListResponse {
  data: Artist[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Lấy danh sách nghệ sĩ
 */
export const getArtists = async (page: number = 1, limit: number = 100, search?: string): Promise<ArtistListResponse> => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get<ArtistListResponse>(
      `${API_BASE_URL}/artists`,
      {
        params: { page, limit, search },
        headers: token ? {
          Authorization: `Bearer ${token}`,
        } : {},
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching artists:', error);
    return { data: [], total: 0, page: 1, limit: 100 };
  }
};

/**
 * Lấy thông tin nghệ sĩ theo ID
 */
export const getArtistById = async (id: number): Promise<Artist> => {
  const token = localStorage.getItem('token');
  const response = await axios.get<Artist>(
    `${API_BASE_URL}/artists/${id}`,
    {
      headers: token ? {
        Authorization: `Bearer ${token}`,
      } : {},
    }
  );
  return response.data;
};

/**
 * Interface cho artist với tổng lượt nghe
 */
export interface ArtistWithTotalViews extends Artist {
  totalViews: number;
}

