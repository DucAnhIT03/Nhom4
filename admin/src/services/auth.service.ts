import axios from '../apis/axios';

export interface LoginResponse {
  accessToken: string;
}

export interface UserProfile {
  id: string;
  email?: string;
}

export const login = async (email: string, password: string) => {
  const response = await axios.post<LoginResponse>('/auth/admin/login', {
    email,
    password,
  });
  return response;
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const getCurrentUser = async (): Promise<UserProfile> => {
  const response = await axios.get<UserProfile>('/auth/me');
  return response.data;
};

