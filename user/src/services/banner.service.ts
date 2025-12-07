import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface Banner {
  id: number;
  title: string;
  imageUrl: string;
  content?: string;
  songId?: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  song?: {
    id: number;
    title: string;
    artist?: {
      id: number;
      artistName: string;
    };
  };
}

export const getActiveBanners = async (): Promise<Banner[]> => {
  try {
    const response = await axios.get<Banner[]>(`${API_BASE_URL}/banners/active`);
    return response.data;
  } catch (error) {
    console.error('Error fetching active banners:', error);
    return [];
  }
};

export const getBanners = async (): Promise<Banner[]> => {
  try {
    const response = await axios.get<Banner[]>(`${API_BASE_URL}/banners`);
    return response.data;
  } catch (error) {
    console.error('Error fetching banners:', error);
    return [];
  }
};

