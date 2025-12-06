import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface RegisterDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface VerifyOtpDto {
  email: string;
  otp: string;
}

export interface LoginResponse {
  accessToken: string;
}

export interface RegisterResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
}

export const register = async (data: RegisterDto): Promise<RegisterResponse> => {
  const response = await axios.post<RegisterResponse>(`${API_BASE_URL}/auth/register`, data);
  return response.data;
};

export const verifyOtp = async (data: VerifyOtpDto): Promise<LoginResponse> => {
  const response = await axios.post<LoginResponse>(`${API_BASE_URL}/auth/verify-otp`, data);
  return response.data;
};

export const login = async (data: LoginDto): Promise<LoginResponse> => {
  const response = await axios.post<LoginResponse>(`${API_BASE_URL}/auth/login`, data);
  return response.data;
};

export interface UserProfile {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

export const getCurrentUser = async (): Promise<UserProfile> => {
  const token = localStorage.getItem('token');
  const response = await axios.get<UserProfile>(`${API_BASE_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

