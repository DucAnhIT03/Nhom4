import axios from '../apis/axios';

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

export interface CreateBannerDto {
  title: string;
  imageUrl: string;
  content?: string;
  songId?: number;
  isActive?: boolean;
}

export interface UpdateBannerDto {
  title?: string;
  imageUrl?: string;
  content?: string;
  songId?: number;
  isActive?: boolean;
}

export const getBanners = async () => {
  const response = await axios.get<Banner[]>('/banners');
  return response.data;
};

export const getActiveBanners = async () => {
  const response = await axios.get<Banner[]>('/banners/active');
  return response.data;
};

export const getBannerById = async (id: number) => {
  const response = await axios.get<Banner>(`/banners/${id}`);
  return response.data;
};

export const createBanner = async (data: CreateBannerDto) => {
  const response = await axios.post<Banner>('/banners', data);
  return response.data;
};

export const updateBanner = async (id: number, data: UpdateBannerDto) => {
  const response = await axios.patch<Banner>(`/banners/${id}`, data);
  return response.data;
};

export const deleteBanner = async (id: number) => {
  const response = await axios.delete(`/banners/${id}`);
  return response.data;
};

