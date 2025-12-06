import axios from '../apis/axios';

export interface Genre {
  id: number;
  genreName: string;
  imageUrl?: string;
}

export interface CreateGenreDto {
  genreName: string;
  imageUrl?: string;
}

export interface UpdateGenreDto {
  genreName?: string;
  imageUrl?: string;
}

export const getGenres = async () => {
  const response = await axios.get<Genre[]>('/genres');
  return response.data;
};

export const getGenreById = async (id: number) => {
  const response = await axios.get<Genre>(`/genres/${id}`);
  return response.data;
};

export const createGenre = async (data: CreateGenreDto) => {
  const response = await axios.post<Genre>('/genres', data);
  return response.data;
};

export const updateGenre = async (id: number, data: UpdateGenreDto) => {
  const response = await axios.patch<Genre>(`/genres/${id}`, data);
  return response.data;
};

export const deleteGenre = async (id: number) => {
  const response = await axios.delete(`/genres/${id}`);
  return response.data;
};

export const getGenresOfSong = async (songId: number) => {
  const response = await axios.get<Genre[]>(`/genres/song/${songId}`);
  return response.data;
};

export const updateSongGenres = async (songId: number, genreIds: number[]) => {
  const response = await axios.post('/genres/song', {
    songId,
    genreIds,
  });
  return response.data;
};

