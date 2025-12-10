import axios from '../apis/axios';

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
    profileImage?: string;
  };
  song?: {
    id: number;
    title: string;
    artistId: number;
  };
}

export interface CommentListResponse {
  data: Comment[];
  total: number;
  page: number;
  limit: number;
}

export interface UpdateCommentDto {
  content?: string;
}

export const getComments = async (page: number = 1, limit: number = 10, search?: string) => {
  const response = await axios.get<CommentListResponse>('/comments/admin/all', {
    params: { page, limit, search },
  });
  return response.data;
};

export const getCommentById = async (id: number) => {
  const response = await axios.get<Comment>(`/comments/${id}`);
  return response.data;
};

export const updateComment = async (id: number, data: UpdateCommentDto) => {
  const response = await axios.patch<Comment>(`/comments/${id}`, data);
  return response.data;
};

export const deleteComment = async (id: number) => {
  const response = await axios.delete(`/comments/${id}`);
  return response.data;
};

export interface QueryCommentDto {
  songId: number;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CommentBySongResponse {
  data: Comment[];
  total: number;
  page: number;
  limit: number;
}

export const getCommentsBySong = async (query: QueryCommentDto) => {
  const response = await axios.get<CommentBySongResponse>('/comments', {
    params: query,
  });
  return response.data;
};

