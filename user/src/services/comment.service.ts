import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface Comment {
  id: number;
  userId: number;
  songId: number;
  content: string;
  parentId?: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface CreateCommentDto {
  userId: number;
  songId: number;
  content: string;
  parentId?: number;
}

export interface QueryCommentDto {
  songId: number;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CommentResponse {
  data: Comment[];
  total: number;
  page: number;
  limit: number;
}

export const getCommentsBySong = async (query: QueryCommentDto): Promise<CommentResponse> => {
  const token = localStorage.getItem('token');
  const response = await axios.get<CommentResponse>(`${API_BASE_URL}/comments`, {
    params: query,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const createComment = async (dto: CreateCommentDto): Promise<Comment> => {
  const token = localStorage.getItem('token');
  const response = await axios.post<Comment>(`${API_BASE_URL}/comments`, dto, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const updateComment = async (id: number, content: string): Promise<Comment> => {
  const token = localStorage.getItem('token');
  const response = await axios.patch<Comment>(
    `${API_BASE_URL}/comments/${id}`,
    { content },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

export const deleteComment = async (id: number): Promise<void> => {
  const token = localStorage.getItem('token');
  await axios.delete(`${API_BASE_URL}/comments/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getCommentsByArtist = async (artistId: number, sortBy: 'time' | 'likes' = 'time'): Promise<Comment[]> => {
  const token = localStorage.getItem('token');
  const response = await axios.get<Comment[]>(`${API_BASE_URL}/comments/artist/${artistId}`, {
    params: { sortBy },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const deleteCommentByArtist = async (id: number): Promise<void> => {
  const token = localStorage.getItem('token');
  await axios.delete(`${API_BASE_URL}/comments/artist/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

