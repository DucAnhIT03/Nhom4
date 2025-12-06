import axios from '../apis/axios';

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

export interface CreateArtistDto {
  artistName: string;
  bio?: string;
  avatar?: string;
  nationality?: string;
  age?: number;
}

export interface UpdateArtistDto {
  artistName?: string;
  bio?: string;
  avatar?: string;
  nationality?: string;
  age?: number;
}

export const getArtists = async (page: number = 1, limit: number = 10, search?: string) => {
  const response = await axios.get<ArtistListResponse>('/artists', {
    params: { page, limit, search },
  });
  return response.data;
};

export const getArtistById = async (id: number) => {
  const response = await axios.get<Artist>(`/artists/${id}`);
  return response.data;
};

export const createArtist = async (data: CreateArtistDto) => {
  const response = await axios.post<Artist>('/artists', data);
  return response.data;
};

export const updateArtist = async (id: number, data: UpdateArtistDto) => {
  const response = await axios.put<Artist>(`/artists/${id}`, data);
  return response.data;
};

export const deleteArtist = async (id: number) => {
  const response = await axios.delete(`/artists/${id}`);
  return response.data;
};

